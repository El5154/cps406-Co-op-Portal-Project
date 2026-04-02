const request = require("supertest");
const path = require("path");
const fs = require("fs");
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
  const studentID = "123456789";
  const supervisorUsername = "supervisor1";
  const uploadDir = path.join(__dirname, "../uploads/evaluations");
  const uploadedFilePath = path.join(uploadDir, `${studentID}_evaluation.pdf`);

  beforeEach(async () => {
    resetDatabase();

    if (fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    seedUser({
      username: supervisorUsername,
      password: "pass123",
      role: "supervisor"
    });

    seedApplicant({
      name: "Test Student",
      studentID,
      email: "student@torontomu.ca",
      supervisor: supervisorUsername
    });

    seedReport({
      studentID,
      report_status: "Submitted",
      evaluation_status: "Not Evaluated",
      deadline: "2099-12-31T23:59:00",
      report_filename: `${studentID}_report.pdf`,
      report_path: `uploads/reports/${studentID}_report.pdf`,
      report_uploaded: 1,
      report_uploaded_at: "2099-01-01T10:00:00",
      evaluation_filename: null,
      evaluation_path: null
    });

    supervisorAgent = request.agent(app);

    await supervisorAgent.post("/login").send({
      username: supervisorUsername,
      password: "pass123"
    });
  });

  afterEach(() => {
    if (fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
  });

  describe("GET /supervisor/students", () => {
    test("denies unauthenticated user", async () => {
      const res = await request(app).get("/supervisor/students");

      expect([401, 403]).toContain(res.statusCode);
    });

    test("returns assigned students for logged-in supervisor", async () => {
      const res = await supervisorAgent.get("/supervisor/students");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);

      expect(res.body[0]).toMatchObject({
        studentID: "123456789",
        name: "Test Student",
        email: "student@torontomu.ca",
        evaluation_status: "Not Evaluated"
      });
    });

    test("returns empty array when supervisor has no assigned students", async () => {
      resetDatabase();

      seedUser({
        username: supervisorUsername,
        password: "pass123",
        role: "supervisor"
      });

      supervisorAgent = request.agent(app);
      await supervisorAgent.post("/login").send({
        username: supervisorUsername,
        password: "pass123"
      });

      const res = await supervisorAgent.get("/supervisor/students");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("PATCH /uploadEvaluation", () => {
    test("denies unauthenticated user", async () => {
      const res = await request(app)
        .patch("/uploadEvaluation")
        .send({
          studentID,
          overallPerformance: "Good"
        });

      expect([401, 403]).toContain(res.statusCode);
    });

    test("rejects missing studentID", async () => {
      const res = await supervisorAgent
        .patch("/uploadEvaluation")
        .send({
          overallPerformance: "Good"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("studentID is required");
    });

    test("rejects missing overallPerformance", async () => {
      const res = await supervisorAgent
        .patch("/uploadEvaluation")
        .send({
          studentID
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("overallPerformance is required");
    });

    test("updates evaluation_status successfully", async () => {
      const res = await supervisorAgent
        .patch("/uploadEvaluation")
        .send({
          studentID,
          overallPerformance: "Excellent"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(
        `Evaluation for student ID: ${studentID} updated successfully.`
      );

      const updated = db.prepare(`
        SELECT evaluation_status
        FROM reports
        WHERE studentID = ?
      `).get(studentID);

      expect(updated.evaluation_status).toBe("Excellent");
    });

    test("returns 404 when report row does not exist", async () => {
      resetDatabase();

      seedUser({
        username: supervisorUsername,
        password: "pass123",
        role: "supervisor"
      });

      seedApplicant({
        name: "Test Student",
        studentID,
        email: "student@torontomu.ca",
        supervisor: supervisorUsername
      });

      supervisorAgent = request.agent(app);
      await supervisorAgent.post("/login").send({
        username: supervisorUsername,
        password: "pass123"
      });

      const res = await supervisorAgent
        .patch("/uploadEvaluation")
        .send({
          studentID,
          overallPerformance: "Excellent"
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(`No report found for student ID ${studentID}`);
    });
  });

  describe("PATCH /uploadEvaluationFile/:studentID", () => {
    test("denies unauthenticated user", async () => {
      const pdfLikeBuffer = Buffer.from("%PDF-1.4 fake pdf content");

      const res = await request(app)
        .patch(`/uploadEvaluationFile/${studentID}`)
        .attach("evaluationFile", pdfLikeBuffer, "evaluation.pdf");

      expect([401, 403]).toContain(res.statusCode);
    });

    test("rejects missing file", async () => {
      const res = await supervisorAgent.patch(`/uploadEvaluationFile/${studentID}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Evaluation file is required.");
    });

    test("rejects non-pdf file", async () => {
      const txtBuffer = Buffer.from("not a pdf");

      const res = await supervisorAgent
        .patch(`/uploadEvaluationFile/${studentID}`)
        .attach("evaluationFile", txtBuffer, "evaluation.txt");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Only PDF files are allowed.");
    });

    test("rejects when applicant does not exist", async () => {
      const pdfLikeBuffer = Buffer.from("%PDF-1.4 fake pdf content");

      const res = await supervisorAgent
        .patch("/uploadEvaluationFile/999999999")
        .attach("evaluationFile", pdfLikeBuffer, "evaluation.pdf");

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Applicant not found.");
    });

    test("rejects when report record does not exist", async () => {
      resetDatabase();

      seedUser({
        username: supervisorUsername,
        password: "pass123",
        role: "supervisor"
      });

      seedApplicant({
        name: "Test Student",
        studentID,
        email: "student@torontomu.ca",
        supervisor: supervisorUsername
      });

      supervisorAgent = request.agent(app);
      await supervisorAgent.post("/login").send({
        username: supervisorUsername,
        password: "pass123"
      });

      const pdfLikeBuffer = Buffer.from("%PDF-1.4 fake pdf content");

      const res = await supervisorAgent
        .patch(`/uploadEvaluationFile/${studentID}`)
        .attach("evaluationFile", pdfLikeBuffer, "evaluation.pdf");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Report record not found.");
    });

    test("uploads evaluation pdf successfully", async () => {
      const pdfLikeBuffer = Buffer.from("%PDF-1.4 fake pdf content");

      const res = await supervisorAgent
        .patch(`/uploadEvaluationFile/${studentID}`)
        .attach("evaluationFile", pdfLikeBuffer, "evaluation.pdf");

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Evaluation file uploaded successfully.");

      const updated = db.prepare(`
        SELECT evaluation_status, evaluation_filename, evaluation_path
        FROM reports
        WHERE studentID = ?
      `).get(studentID);

      expect(updated.evaluation_status).toBe("Evaluated");
      expect(updated.evaluation_filename).toBe(`${studentID}_evaluation.pdf`);
      expect(updated.evaluation_path).toContain(`${studentID}_evaluation.pdf`);
      expect(fs.existsSync(uploadedFilePath)).toBe(true);
    });
  });
});