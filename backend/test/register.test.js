const request = require("supertest");
const app = require("../app");
const db = require("../config/applicants");

beforeEach(() => {
  db.prepare("DELETE FROM applicants").run();
  db.prepare("DELETE FROM users").run();
});

describe("Registration", () => {
  test("add_applicant", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Applicant registered successfully");
  });

  test("add_invalid_applicant", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789"
      });

    expect(res.statusCode).toBe(400);
  });

  test("test_duplicate_id", async () => {
    await request(app).post("/register").send({
      name: "student1",
      studentID: "123456789",
      email: "student1@torontomu.ca"
    });

    const res = await request(app).post("/register").send({
      name: "student2",
      studentID: "123456789",
      email: "student2@torontomu.ca"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Student ID or email already exists");
  });

  test("test_duplicate_email", async () => {
    await request(app).post("/register").send({
      name: "student1",
      studentID: "123456780",
      email: "student@torontomu.ca"
    });

    const res = await request(app).post("/register").send({
      name: "student2",
      studentID: "123456789",
      email: "student@torontomu.ca"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Student ID or email already exists");
  });

  test("valid_student_id", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "987654321",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(201);
  });

  test("invalid_student_id_short", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "12345678",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

  test("invalid_student_id_long", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "1234567890",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

  test("invalid_student_id_letters", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123A5B89C",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

  test("invalid_student_id_special_characters", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "12345-789",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

  test("valid_email_domain", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "111222333",
        email: "valid@torontomu.ca"
      });

    expect(res.statusCode).toBe(201);
  });

  test("invalid_email_domain", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789",
        email: "test@gmail.com"
      });

    expect(res.statusCode).toBe(400);
  });
});