// routes/coordinatorReview.js
const express = require("express");
const router = express.Router();
const db = require("../config/applicants");

const requireCoordinator = require("../middleware/requireCoordinator");

// GET /applicants - coordinator only
router.get("/applicants", requireCoordinator, (req, res) => {
  const applicants = db.prepare(`
    SELECT
      a.id,
      a.name,
      a.studentID,
      a.email,
      a.provisional_status,
      a.final_status,
      a.supervisor,
      COALESCE(r.report_status, 'Not Submitted') AS report_status,
      COALESCE(r.evaluation_status, 'Not Evaluated') AS evaluation_status,
      r.deadline,
      r.report_filename,
      r.report_path,
      r.report_uploaded,
      r.report_uploaded_at,
      r.evaluation_filename,
      r.evaluation_path
    FROM applicants a
    LEFT JOIN reports r ON a.studentID = r.studentID
  `).all();

  return res.status(200).json(applicants);
});

// PATCH /applicants/:id/status - set provisional status
router.patch("/applicants/:id/status", requireCoordinator, (req, res) => {
  const { id } = req.params;
  const { provisional_status } = req.body;

  if (!provisional_status) {
    return res.status(400).json({ error: "provisional_status is required" });
  }

  if (!["Accepted", "Rejected"].includes(provisional_status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const applicant = db.prepare(
    "SELECT * FROM applicants WHERE id = ?"
  ).get(id);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  if (applicant.final_status !== "Pending") {
    return res.status(400).json({
      error: "Cannot change provisional status after finalization"
    });
  }

  db.prepare(
    "UPDATE applicants SET provisional_status = ? WHERE id = ?"
  ).run(provisional_status, id);

  return res.status(200).json({
    message: "Applicant provisional status updated successfully"
  });
});

// PATCH /applicants/:id/finalize - finalize decision
router.patch("/applicants/:id/finalize", requireCoordinator, (req, res) => {
  const { id } = req.params;

  const applicant = db.prepare(
    "SELECT * FROM applicants WHERE id = ?"
  ).get(id);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  if (applicant.provisional_status === "Pending") {
    return res.status(400).json({
      error: "Provisional decision must be made before finalization"
    });
  }

  if (applicant.final_status !== "Pending") {
    return res.status(400).json({
      error: "Applicant decision has already been finalized"
    });
  }

  db.prepare(
    "UPDATE applicants SET final_status = ? WHERE id = ?"
  ).run(applicant.provisional_status, id);

  return res.status(200).json({
    message: "Applicant final status updated successfully"
  });
});

router.patch("/applicants/:id/supervisor", requireCoordinator, (req, res) => {
  const { id } = req.params;
  const { supervisor } = req.body;

  if (!supervisor) {
    return res.status(400).json({ error: "Supervisor is required"});
  }

  const applicant = db.prepare(`
    SELECT * FROM applicants WHERE id = ?
  `).get(id);

  if (!applicant) {
    return res.status(400).json({ error: "Applicant not found"});
  }

  db.prepare(`
    UPDATE applicants SET supervisor = ?
    WHERE id = ?
  `).run(supervisor, id);

  return res.status(200).json({ message: "Supervisor assigned successfully"});
});

// Back button route after report review
router.post("/back", requireCoordinator, (req, res) => {
  return res.status(200).json({ message: "Back to coordinator dashboard" });
});

router.get("/applicants/missed-deadline", requireCoordinator, (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const missedApplicants = db.prepare(`
    SELECT a.id, a.name, a.studentID, a.email, a.provisional_status, a.final_status, r.report_status, r.deadline
    FROM applicants a
    JOIN reports r ON a.studentID = r.studentID
    WHERE r.deadline < ? AND r.report_uploaded = 0
  `).all(today);

  return res.status(200).json(missedApplicants);
});

module.exports = router;