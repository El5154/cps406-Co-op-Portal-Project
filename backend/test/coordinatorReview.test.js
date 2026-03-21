const request = require("supertest");
const app = require("../app");
const db = require("../config/applicants");

describe("Application finalization and coordinator status", () => {
  let coordinatorAgent;
  let applicantAgent;
  let applicantId1;
  let applicantId2;

  beforeEach(async () => {
    db.prepare("DELETE FROM users").run();
    db.prepare("DELETE FROM applicants").run();

    db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run("coordinator", "password", "coordinator");

    db.prepare(`
      INSERT INTO applicants (name, studentID, email, provisional_status, final_status)
      VALUES (?, ?, ?, ?, ?)
    `).run("Alice", "123456789", "alice@torontomu.ca", "Pending", "Pending");

    db.prepare(`
      INSERT INTO applicants (name, studentID, email, provisional_status, final_status)
      VALUES (?, ?, ?, ?, ?)
    `).run("Bob", "987654321", "bob@torontomu.ca", "Pending", "Pending");

    const applicants = db.prepare("SELECT * FROM applicants ORDER BY id").all();
    applicantId1 = applicants[0].id;
    applicantId2 = applicants[1].id;

    db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run("123456789", "password", "applicant");

    coordinatorAgent = request.agent(app);
    applicantAgent = request.agent(app);

    await coordinatorAgent.post("/login").send({
      username: "coordinator",
      password: "password"
    });

    await applicantAgent.post("/login").send({
      username: "123456789",
      password: "password"
    });
  });

  test("view_conditional_status_coordinator", async () => {
    const res = await coordinatorAgent.get("/applicants");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty("provisional_status");
  });

  test("view_final_status_coordinator", async () => {
    await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({ provisional_status: "Accepted" });

    await coordinatorAgent
      .patch(`/applicants/${applicantId1}/finalize`)
      .send();

    const res = await coordinatorAgent.get("/applicants");

    expect(res.statusCode).toBe(200);
    const updatedApplicant = res.body.find(a => a.id === applicantId1);
    expect(updatedApplicant.final_status).toBe("Accepted");
  });

  test("coordinator_route_requires_login", async () => {
    const res = await request(app).get("/applicants");
    expect(res.statusCode).toBe(401);
  });

  test("coordinator_route_forbidden_to_applicant", async () => {
    const res = await applicantAgent.get("/applicants");
    expect(res.statusCode).toBe(403);
  });

  test("accept_application", async () => {
    const res = await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({ provisional_status: "Accepted" });

    expect(res.statusCode).toBe(200);

    const updated = db.prepare("SELECT * FROM applicants WHERE id = ?").get(applicantId1);
    expect(updated.provisional_status).toBe("Accepted");
  });

  test("reject_application", async () => {
    const res = await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({ provisional_status: "Rejected" });

    expect(res.statusCode).toBe(200);

    const updated = db.prepare("SELECT * FROM applicants WHERE id = ?").get(applicantId1);
    expect(updated.provisional_status).toBe("Rejected");
  });

  test("decision_finalization_accept", async () => {
    await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({ provisional_status: "Accepted" });

    const res = await coordinatorAgent
      .patch(`/applicants/${applicantId1}/finalize`)
      .send();

    expect(res.statusCode).toBe(200);

    const updated = db.prepare("SELECT * FROM applicants WHERE id = ?").get(applicantId1);
    expect(updated.final_status).toBe("Accepted");
  });

  test("decision_finalization_reject", async () => {
    await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({ provisional_status: "Rejected" });

    const res = await coordinatorAgent
      .patch(`/applicants/${applicantId1}/finalize`)
      .send();

    expect(res.statusCode).toBe(200);

    const updated = db.prepare("SELECT * FROM applicants WHERE id = ?").get(applicantId1);
    expect(updated.final_status).toBe("Rejected");
  });

  test("cannot_finalize_before_provisional", async () => {
    const res = await coordinatorAgent
      .patch(`/applicants/${applicantId1}/finalize`)
      .send();

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Provisional decision must be made before finalization");
  });

  test("cannot_finalize_twice", async () => {
    await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({ provisional_status: "Accepted" });

    await coordinatorAgent
      .patch(`/applicants/${applicantId1}/finalize`)
      .send();

    const res = await coordinatorAgent
      .patch(`/applicants/${applicantId1}/finalize`)
      .send();

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Applicant decision has already been finalized");
  });

  test("cannot_change_provisional_after_finalization", async () => {
    await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({ provisional_status: "Accepted" });

    await coordinatorAgent
      .patch(`/applicants/${applicantId1}/finalize`)
      .send();

    const res = await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({ provisional_status: "Rejected" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Cannot change provisional status after finalization");
  });

  test("cannot_set_invalid_provisional_status", async () => {
    const res = await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({ provisional_status: "Maybe" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid status value");
  });

  test("cannot_set_missing_provisional_status", async () => {
    const res = await coordinatorAgent
      .patch(`/applicants/${applicantId1}/status`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("provisional_status is required");
  });

  test("cannot_update_nonexistent_applicant_status", async () => {
    const res = await coordinatorAgent
      .patch("/applicants/9999/status")
      .send({ provisional_status: "Accepted" });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Applicant not found");
  });

  test("cannot_finalize_nonexistent_applicant", async () => {
    const res = await coordinatorAgent
      .patch("/applicants/9999/finalize")
      .send();

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Applicant not found");
  });

  test("create_account_for_accepted_applicant", async () => {
    await coordinatorAgent
      .patch(`/applicants/${applicantId2}/status`)
      .send({ provisional_status: "Accepted" });

    await coordinatorAgent
      .patch(`/applicants/${applicantId2}/finalize`)
      .send();

    const res = await coordinatorAgent
      .post(`/applicants/${applicantId2}/create-account`)
      .send({ password: "newpass123" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Applicant account created successfully");
    expect(res.body.username).toBe("987654321");

    const createdUser = db.prepare("SELECT * FROM users WHERE username = ?").get("987654321");
    expect(createdUser).toBeTruthy();
    expect(createdUser.role).toBe("applicant");
  });

  test("reject_account_creation_if_not_accepted", async () => {
    const res = await coordinatorAgent
      .post(`/applicants/${applicantId1}/create-account`)
      .send({ password: "newpass123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe(
      "Only applicants with final status Accepted can have an account created"
    );
  });

  test("reject_duplicate_account_creation", async () => {
    await coordinatorAgent
      .patch(`/applicants/${applicantId2}/status`)
      .send({ provisional_status: "Accepted" });

    await coordinatorAgent
      .patch(`/applicants/${applicantId2}/finalize`)
      .send();

    await coordinatorAgent
      .post(`/applicants/${applicantId2}/create-account`)
      .send({ password: "newpass123" });

    const res = await coordinatorAgent
      .post(`/applicants/${applicantId2}/create-account`)
      .send({ password: "newpass123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Account already exists for this applicant");
  });

  test("reject_account_creation_without_password", async () => {
    await coordinatorAgent
      .patch(`/applicants/${applicantId2}/status`)
      .send({ provisional_status: "Accepted" });

    await coordinatorAgent
      .patch(`/applicants/${applicantId2}/finalize`)
      .send();

    const res = await coordinatorAgent
      .post(`/applicants/${applicantId2}/create-account`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Password is required");
  });
});