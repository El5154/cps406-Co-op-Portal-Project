// routes/register.js
const express = require("express");
const router = express.Router();
const db = require("../config/applicants");

// POST /register - Register a new applicant
router.post("/register", (req, res) => {
  const { name, studentID, email, password } = req.body;

  if (!name || !studentID || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!/^\d{9}$/.test(studentID)) {
    return res.status(400).json({ error: "Student ID must be exactly 9 digits" });
  }

  if (!email.endsWith("@torontomu.ca")) {
    return res.status(400).json({ error: "Email must end with @torontomu.ca" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  try {
    const insertApplicant = db.prepare(`
      INSERT INTO applicants (name, studentID, email)
      VALUES (?, ?, ?)
    `);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertApplicant.run(name, studentID, email);
      insertUser.run(studentID, password, "applicant");
    });

    transaction();

    return res.status(201).json({
      message: "Applicant registered successfully"
    });
    
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({
        error: "Student ID or email already exists"
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;