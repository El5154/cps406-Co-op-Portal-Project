const request = require("supertest");
const app = require("../app");
const db = require("../config/applicants");

describe("Login and security check", () => {
  beforeEach(() => {
    db.prepare("DELETE FROM users").run();
    db.prepare("DELETE FROM applicants").run();

    db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run("coordinator", "password", "coordinator");

    db.prepare(`
      INSERT INTO applicants (name, studentID, email)
      VALUES (?, ?, ?)
    `).run("Alice", "123456789", "alice@torontomu.ca");

    db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run("123456789", "password", "applicant");
  });

  test("login_valid_user_coordinator", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        username: "coordinator",
        password: "password"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.role).toBe("coordinator");
  });

  test("login_valid_user_applicant", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        username: "123456789",
        password: "password"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.role).toBe("applicant");
  });

  test("login_incorrect_password", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        username: "coordinator",
        password: "wrongpassword"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("login_incorrect_email", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        username: "wronguser",
        password: "password"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("login_is_empty", async () => {
    const res = await request(app)
      .post("/login")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Username and password are required");
  });

  test("login_nonexistent_user", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        username: "notreal",
        password: "password"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("logout destroys session and blocks protected route", async () => {
    const agent = request.agent(app);

    const loginRes = await agent.post("/login").send({
      username: "coordinator",
      password: "password"
    });
    expect(loginRes.statusCode).toBe(200);

    const beforeLogout = await agent.get("/dashboard");
    expect(beforeLogout.statusCode).toBe(200);

    const logoutRes = await agent.post("/logout");
    expect(logoutRes.statusCode).toBe(200);

    const afterLogout = await agent.get("/dashboard");
    expect(afterLogout.statusCode).toBe(401);
  });

  test("unauthenticated user blocked from protected route", async () => {
    const res = await request(app).get("/dashboard");
    expect(res.statusCode).toBe(401);
  });
});