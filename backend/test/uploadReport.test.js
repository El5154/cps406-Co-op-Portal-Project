const request = require("supertest");
const fs = require("fs");
const path = require("path");
const app = require("../app");
const db = require("../config/applicants");

const testFilesDir = path.join(__dirname, "test-files");
const validPdfPath = path.join(testFilesDir, "valid.pdf");
const invalidTxtPath = path.join(testFilesDir, "invalid.txt");
const largePdfPath = path.join(testFilesDir, "large.pdf");

beforeAll(() => {
  fs.mkdirSync(testFilesDir, { recursive: true });

  // tiny fake pdf file
  fs.writeFileSync(
    validPdfPath,
    "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
  );

  // invalid text file
  fs.writeFileSync(invalidTxtPath, "this is not a pdf");

  // create a file slightly larger than 10MB
  const elevenMB = Buffer.alloc(11 * 1024 * 1024, "a");
  fs.writeFileSync(largePdfPath, elevenMB);
});

beforeEach(() => {
  // clear tables before each test
  db.prepare("DELETE FROM applicants").run();
  db.prepare("DELETE FROM users").run();

  // insert applicant row
  db.prepare(`
    INSERT INTO applicants (
      name,
      studentID,
      email,
      provisional_status,
      final_status,
      report_status,
      evaluation_status,
      deadline,
      report_filename,
      report_path,
      report_uploaded,
      report_uploaded_at,
      evaluation_filename,
      evaluation_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "Test Applicant",
    "500123456",
    "test@torontomu.ca",
    "Pending",
    "Pending",
    "Not Submitted",
    "Not Evaluated",
    null,
    null,
    null,
    0,
    null,
    null,
    null
  );

  // insert applicant user
  db.prepare(`
    INSERT INTO users (username, password, role)
    VALUES (?, ?, ?)
  `).run("500123456", "password123", "applicant");

  // insert coordinator user
  db.prepare(`
    INSERT INTO users (username, password, role)
    VALUES (?, ?, ?)
  `).run("coordinator1", "password123", "coordinator");
});

afterAll(() => {
  try {
    if (fs.existsSync(validPdfPath)) fs.unlinkSync(validPdfPath);
    if (fs.existsSync(invalidTxtPath)) fs.unlinkSync(invalidTxtPath);
    if (fs.existsSync(largePdfPath)) fs.unlinkSync(largePdfPath);

    if (fs.existsSync(testFilesDir)) fs.rmdirSync(testFilesDir);

    if (fs.existsSync("test.db")) fs.unlinkSync("test.db");
  } catch (err) {
    // ignore cleanup errors
  }
});

describe("Upload Report Route", () => {
  test("should reject upload if not logged in", async () => {
    const res = await request(app)
      .post("/uploadReport")
      .attach("report", validPdfPath);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("You must be logged in");
  });

  test("should reject upload if logged in as coordinator", async () => {
    const agent = request.agent(app);

    const loginRes = await agent.post("/login").send({
      username: "coordinator1",
      password: "password123"
    });

    expect(loginRes.status).toBe(200);

    const res = await agent
      .post("/uploadReport")
      .attach("report", validPdfPath);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  test("should upload a valid pdf for a logged-in applicant", async () => {
    const agent = request.agent(app);

    const loginRes = await agent.post("/login").send({
      username: "500123456",
      password: "password123"
    });

    expect(loginRes.status).toBe(200);

    const res = await agent
      .post("/uploadReport")
      .attach("report", validPdfPath);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Report uploaded successfully");

    const applicant = db.prepare(`
      SELECT report_status, report_filename, report_path, report_uploaded, report_uploaded_at
      FROM applicants
      WHERE studentID = ?
    `).get("500123456");

    expect(applicant.report_status).toBe("Submitted");
    expect(applicant.report_uploaded).toBe(1);
    expect(applicant.report_filename).toBe("500123456_report.pdf");
    expect(applicant.report_path).toContain("uploads");
    expect(applicant.report_uploaded_at).not.toBeNull();
  });

  test("should reject upload if no file is sent", async () => {
    const agent = request.agent(app);

    const loginRes = await agent.post("/login").send({
      username: "500123456",
      password: "password123"
    });

    expect(loginRes.status).toBe(200);

    const res = await agent.post("/uploadReport");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No file uploaded");
  });

  test("should reject non-pdf files", async () => {
    const agent = request.agent(app);

    const loginRes = await agent.post("/login").send({
      username: "500123456",
      password: "password123"
    });

    expect(loginRes.status).toBe(200);

    const res = await agent
      .post("/uploadReport")
      .attach("report", invalidTxtPath);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Only PDF files are allowed!");
  });

  test("should reject files larger than 10MB", async () => {
    const agent = request.agent(app);

    const loginRes = await agent.post("/login").send({
      username: "500123456",
      password: "password123"
    });

    expect(loginRes.status).toBe(200);

    const res = await agent
      .post("/uploadReport")
      .attach("report", largePdfPath, {
        filename: "large.pdf",
        contentType: "application/pdf"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/File too large/i);
  });
});