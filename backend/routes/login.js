// routes/login.js
const express = require("express");
const router = express.Router();
const db = require("../config/applicants");

// Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = db.prepare(`
    SELECT * FROM users 
    WHERE username = ? AND password = ?
  `).get(username, password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const sessionUser = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  if (user.role === "applicant") {
    const applicant = db.prepare(
      "SELECT studentID FROM applicants WHERE studentID = ?"
    ).get(user.username);

    if (applicant) {
      sessionUser.studentID = applicant.studentID;
    }
  }

  req.session.user = sessionUser;

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to save session" });
    }

    return res.status(200).json({
      message: "Login successful",
      role: user.role
    });
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(200).json({ message: "Logged out" });
  });
});

module.exports = router;