const express = require("express");
const router = express.Router();
const db = require("../config/applicants");
const requireAuth = require("../middleware/requireAuth");

// Get applicant dashboard information
router.get("/applicant/dashboard", requireAuth, (req, res) => {
  if (req.session.user.role !== "applicant") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const studentID = req.session.user.studentID;

  const applicant = db.prepare(`
    SELECT
      a.name,
      a.studentID,
      a.provisional_status,
      a.final_status,
      r.report_status,
      r.report_filename,
      r.report_uploaded_at,
      r.evaluation_status,
      r.deadline
    FROM applicants a
    LEFT JOIN reports r ON a.studentID = r.studentID
    WHERE a.studentID = ?
  `).get(studentID);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  return res.status(200).json(applicant);
});

module.exports = router;