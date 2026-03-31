const request = require("supertest");
const app = require("../app");
const {
  resetDatabase,
  seedUser,
  seedApplicant,
  seedReport,
  db
} = require("./testUtils");

describe("Supervisor workflow", () => {
  let supervisorAgent;
  let supervisorUser;

  beforeEach(async () => {
    resetDatabase();

    seedUser({
      username: "supervisor1",
      password: "pass123",
      role: "supervisor"
    });

    supervisorUser = db.prepare(`
      SELECT id, username, role
      FROM users
      WHERE username = ?
    `).get("supervisor1");

    seedApplicant({
      name: "Test Student",
      studentID: "123456789",
      email: "student@torontomu.ca"
    });

    db.prepare(`
      UPDATE applicants
      SET supervisor = ?
      WHERE studentID = ?
    `).run(supervisorUser.id, "123456789");

    seedReport({
      studentID: "123456789",
      report_status: "Submitted",
      evaluation_status: "Not Evaluated",
      deadline: "2099-12-31T23:59:00",
      report_filename: "123456789_report.pdf",
      report_path: "uploads/reports/123456789_report.pdf",
      report_uploaded: 1,
      report_uploaded_at: "2099-01-01T10:00:00"
    });

    supervisorAgent = request.agent(app);

    await supervisorAgent.post("/login").send({
      username: "supervisor1",
      password: "pass123"
    });
  });

  describe("GET /supervisor/students", () => {
    test("denies unauthenticated user", async () => {
      const res = await request(app).get("/supervisor/students");
      expect(res.statusCode).toBe(401);
    });

    test("returns assigned students for logged-in supervisor", async () => {
      const res = await supervisorAgent.get("/supervisor/students");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      expect(res.body[0].studentID).toBe("123456789");
      expect(res.body[0].name).toBe("Test Student");
      expect(res.body[0].email).toBe("student@torontomu.ca");
      expect(res.body[0].evaluation_status).toBe("Not Evaluated");
    });
  });

  describe("PATCH /uploadEvaluation", () => {
    test("denies unauthenticated user", async () => {
      const res = await request(app)
        .patch("/uploadEvaluation")
        .send({
          studentId: "123456789",
          overallPerformance: "Good"
        });

      expect(res.statusCode).toBe(401);
    });

    test("updates evaluation_status successfully", async () => {
      const res = await supervisorAgent
        .patch("/uploadEvaluation")
        .send({
          studentId: "123456789",
          overallPerformance: "Excellent"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(
        "Evaluation for student ID: 123456789 updated successfully."
      );

      const updated = db.prepare(`
        SELECT evaluation_status
        FROM reports
        WHERE studentID = ?
      `).get("123456789");

      expect(updated.evaluation_status).toBe("Excellent");
    });

    test("returns 404 when report row does not exist", async () => {
      const res = await supervisorAgent
        .patch("/uploadEvaluation")
        .send({
          studentId: "999999999",
          overallPerformance: "Good"
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(
        "No report found for student ID 999999999"
      );
    });
  });
});