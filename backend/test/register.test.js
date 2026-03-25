// test/register.test.js

const request = require("supertest");
const express = require("express");

jest.mock("../config/applicants", () => ({
  prepare: jest.fn(),
}));

const db = require("../config/applicants");
const registerRoutes = require("../routes/register");

describe("Register Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(registerRoutes);

    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    test("add_applicant: registers a new applicant with valid info", async () => {
      const runMock = jest.fn();

      db.prepare.mockReturnValue({
        run: runMock,
      });

      const res = await request(app)
        .post("/register")
        .send({
          name: "Eric Liu",
          studentID: "123456789",
          email: "eric@torontomu.ca",
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: "Applicant registered successfully",
      });
      expect(runMock).toHaveBeenCalledWith(
        "Eric Liu",
        "123456789",
        "eric@torontomu.ca"
      );
    });

    test("add_invalid_applicant: rejects when required fields are missing", async () => {
      const res = await request(app)
        .post("/register")
        .send({
          name: "Eric Liu",
          studentID: "123456789",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "All fields are required",
      });
    });

    test("valid_student_id: accepts exactly 9 digits", async () => {
      const runMock = jest.fn();

      db.prepare.mockReturnValue({
        run: runMock,
      });

      const res = await request(app)
        .post("/register")
        .send({
          name: "Student One",
          studentID: "987654321",
          email: "student1@torontomu.ca",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Applicant registered successfully");
    });

    test("invalid_student_id_short: rejects student ID shorter than 9 digits", async () => {
      const res = await request(app)
        .post("/register")
        .send({
          name: "Student One",
          studentID: "12345678",
          email: "student1@torontomu.ca",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Student ID must be exactly 9 digits",
      });
    });

    test("invalid_student_id_long: rejects student ID longer than 9 digits", async () => {
      const res = await request(app)
        .post("/register")
        .send({
          name: "Student One",
          studentID: "1234567890",
          email: "student1@torontomu.ca",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Student ID must be exactly 9 digits",
      });
    });

    test("invalid_student_id_letters: rejects student ID containing letters", async () => {
      const res = await request(app)
        .post("/register")
        .send({
          name: "Student One",
          studentID: "123A5B89C",
          email: "student1@torontomu.ca",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Student ID must be exactly 9 digits",
      });
    });

    test("invalid_student_id_special_characters: rejects student ID with special characters", async () => {
      const res = await request(app)
        .post("/register")
        .send({
          name: "Student One",
          studentID: "12$%56789",
          email: "student1@torontomu.ca",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Student ID must be exactly 9 digits",
      });
    });

    test("valid_email_domain: accepts email ending with @torontomu.ca", async () => {
      const runMock = jest.fn();

      db.prepare.mockReturnValue({
        run: runMock,
      });

      const res = await request(app)
        .post("/register")
        .send({
          name: "Valid Email User",
          studentID: "222333444",
          email: "valid@torontomu.ca",
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: "Applicant registered successfully",
      });
    });

    test("rejects non-TMU email domain", async () => {
      const res = await request(app)
        .post("/register")
        .send({
          name: "Invalid Email User",
          studentID: "222333444",
          email: "invalid@gmail.com",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Email must end with @torontomu.ca",
      });
    });

    test("test_duplicate_id: rejects duplicate student ID", async () => {
      db.prepare.mockReturnValue({
        run: jest.fn(() => {
          throw new Error("UNIQUE constraint failed: applicants.studentID");
        }),
      });

      const res = await request(app)
        .post("/register")
        .send({
          name: "Duplicate ID User",
          studentID: "123456789",
          email: "new@torontomu.ca",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Student ID or email already exists",
      });
    });

    test("test_duplicate_email: rejects duplicate email", async () => {
      db.prepare.mockReturnValue({
        run: jest.fn(() => {
          throw new Error("UNIQUE constraint failed: applicants.email");
        }),
      });

      const res = await request(app)
        .post("/register")
        .send({
          name: "Duplicate Email User",
          studentID: "999888777",
          email: "existing@torontomu.ca",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Student ID or email already exists",
      });
    });

    test("returns 500 for unexpected database errors", async () => {
      db.prepare.mockReturnValue({
        run: jest.fn(() => {
          throw new Error("Database crashed");
        }),
      });

      const res = await request(app)
        .post("/register")
        .send({
          name: "Eric Liu",
          studentID: "123456789",
          email: "eric@torontomu.ca",
        });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: "Internal server error",
      });
    });
  });
});