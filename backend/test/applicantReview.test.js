const request = require("supertest");
const app = require("../app");
const db = require("../config/applicants");

describe("Application status for student", () => {
  let applicantAgent;
  let coordinatorAgent;

  beforeEach(async () => {
    db.prepare("DELETE FROM users").run();
    db.prepare("DELETE FROM applicants").run();

    db.prepare(`
      INSERT INTO applicants (name, studentID, email, provisional_status, final_status)
      VALUES (?, ?, ?, ?, ?)
    `).run("Alice", "123456789", "alice@torontomu.ca", "Pending", "Pending");

    db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run("123456789", "password", "applicant");

    db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run("coordinator", "password", "coordinator");

    applicantAgent = request.agent(app);
    coordinatorAgent = request.agent(app);

    await applicantAgent.post("/login").send({
      username: "123456789",
      password: "password"
    });

    await coordinatorAgent.post("/login").send({
      username: "coordinator",
      password: "password"
    });
  });

  test("view_condtional_status_pending", async () => {
    const res = await applicantAgent.get("/applicants/status");

    expect(res.statusCode).toBe(200);
    expect(res.body.studentID).toBe("123456789");
    expect(res.body.provisional_status).toBe("Pending");
    expect(res.body.final_status).toBe("Pending");
  });

  test("view_conditional_status_accept", async () => {
    db.prepare(`
      UPDATE applicants
      SET provisional_status = ?
      WHERE studentID = ?
    `).run("Accepted", "123456789");

    const res = await applicantAgent.get("/applicants/status");

    expect(res.statusCode).toBe(200);
    expect(res.body.provisional_status).toBe("Accepted");
    expect(res.body.final_status).toBe("Pending");
  });

  test("view_conditional_status_reject", async () => {
    db.prepare(`
      UPDATE applicants
      SET provisional_status = ?
      WHERE studentID = ?
    `).run("Rejected", "123456789");

    const res = await applicantAgent.get("/applicants/status");

    expect(res.statusCode).toBe(200);
    expect(res.body.provisional_status).toBe("Rejected");
    expect(res.body.final_status).toBe("Pending");
  });

  test("view_final_status_accept", async () => {
    db.prepare(`
      UPDATE applicants
      SET provisional_status = ?, final_status = ?
      WHERE studentID = ?
    `).run("Accepted", "Accepted", "123456789");

    const res = await applicantAgent.get("/applicants/status");

    expect(res.statusCode).toBe(200);
    expect(res.body.provisional_status).toBe("Accepted");
    expect(res.body.final_status).toBe("Accepted");
  });

  test("view_final_status_reject", async () => {
    db.prepare(`
      UPDATE applicants
      SET provisional_status = ?, final_status = ?
      WHERE studentID = ?
    `).run("Rejected", "Rejected", "123456789");

    const res = await applicantAgent.get("/applicants/status");

    expect(res.statusCode).toBe(200);
    expect(res.body.provisional_status).toBe("Rejected");
    expect(res.body.final_status).toBe("Rejected");
  });

  test("status_after_finalization", async () => {
    db.prepare(`
      UPDATE applicants
      SET provisional_status = ?, final_status = ?
      WHERE studentID = ?
    `).run("Accepted", "Accepted", "123456789");

    const res = await applicantAgent.get("/applicants/status");

    expect(res.statusCode).toBe(200);
    expect(res.body.final_status).toBe("Accepted");
  });

  test("student_status_requires_login", async () => {
    const res = await request(app).get("/applicants/status");
    expect(res.statusCode).toBe(401);
  });

  test("student_status_forbidden_to_coordinator", async () => {
    const res = await coordinatorAgent.get("/applicants/status");
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  test("status_returns_404_if_applicant_missing", async () => {
    db.prepare("DELETE FROM applicants WHERE studentID = ?").run("123456789");

    const res = await applicantAgent.get("/applicants/status");

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Applicant not found");
  });
});