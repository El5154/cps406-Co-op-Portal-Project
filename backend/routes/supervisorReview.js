const express = require('express');
const router = express.Router();
const db = require(`../config/applicants`);
const requireAuth = require(`../middleware/requireSupervisor`);
const multer = require("multer");
const path = require("path");
const fs = require("fs");

router.get(`/supervisor/students`, requireAuth, (req, res) => {
    const supervisorId = req.session.user.username;
    const query = `
        SELECT 
            a.studentID, 
            a.name, 
            a.email, 
            r.evaluation_status
        FROM applicants a
        JOIN reports r ON a.studentID = r.studentID
        WHERE a.supervisor = ? 
    `;

    try {
        const students = db.prepare(query).all(supervisorId);

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students for supervisor:', error);
        res.status(500).json({ error: 'An error occurred while fetching students.' });
    }
});

router.patch(`/uploadEvaluation`, requireAuth, (req, res) => {
    const supervisorId = req.session.user.id;
    const { studentID, overallPerformance } = req.body;

    if (!studentID) {
        return res.status(400).json({ error: "studentID is required" });
    }

    if (!overallPerformance) {
        return res.status(400).json({ error: "overallPerformance is required" });
    }

    const updateQuery = `
        UPDATE reports
        SET evaluation_status = ?
        WHERE studentID = ?
    `;

    try {
        const result = db.prepare(updateQuery).run(overallPerformance, studentID);

        if (result.changes === 0) {
            return res.status(404).json({ error: `No report found for student ID ${studentID}` });
        }

        res.json({ message: `Evaluation for student ID: ${studentID} updated successfully.` });
    } catch (error) {
        return res.status(500).json({ error: `Could not update evaluation for student ID ${studentID}.` });
    }
});

const uploadDir = path.join(__dirname, "../uploads/evaluations");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" &&
      path.extname(file.originalname).toLowerCase() === ".pdf";

    if (!isPdf) {
      return cb(new Error("Only PDF files are allowed."));
    }

    cb(null, true);
  }
}).single("evaluationFile");

router.patch("/uploadEvaluationFile/:studentID", requireAuth, (req, res) => {
  upload(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    try {
      const { studentID } = req.params;

      if (!studentID) {
        return res.status(400).json({ error: "Student ID is required." });
      }

      const applicant = db.prepare(`
        SELECT a.*, r.studentID AS report_studentID
        FROM applicants a
        LEFT JOIN reports r ON a.studentID = r.studentID
        WHERE a.studentID = ?
      `).get(studentID);

      if (!applicant) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Applicant not found." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Evaluation file is required." });
      }

      if (req.file.size === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Cannot upload an empty file." });
      }

      if (!applicant.report_studentID) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Report record not found." });
      }

      const finalFilename = `${studentID}_evaluation.pdf`;
      const finalPath = path.join(uploadDir, finalFilename);

      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }

      fs.renameSync(req.file.path, finalPath);

      db.prepare(`
        UPDATE reports
        SET
          evaluation_status = ?,
          evaluation_filename = ?,
          evaluation_path = ?
        WHERE studentID = ?
      `).run(
        "Evaluated",
        finalFilename,
        finalPath,
        studentID
      );

      return res.status(200).json({
        message: "Evaluation file uploaded successfully."
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "An error occurred while uploading the evaluation file."
      });
    }
  });
});

module.exports = router;