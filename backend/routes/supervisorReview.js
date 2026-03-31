const express = require('express');
const router = express.Router();
const db = require(`../config/applicants`);
const requireAuth = require(`../middleware/requireSupervisor`);

router.get(`/supervisor/students`, requireAuth, (req, res) => {
    const supervisorId = req.session.user.id;
    const query = `
        SELECT a.studentID, a.name, a.email, r.evaluation_status
        FROM applicants a
        JOIN reports r ON a.studentID = r.studentID
        WHERE a.supervisor = ? 
    `;

    try {
        const students = db.prepare(query).all(supervisorId);

        res.json(students);
    } catch (error) {
        console.error('Error fetching students for supervisor:', error);
        res.status(500).json({ error: 'An error occurred while fetching students.' });
    }
});

router.patch(`/uploadEvaluation`, requireAuth, (req, res) => {
    const supervisorId = req.session.user.id;
    const { studentId, overallPerformance } = req.body;

    if (!studentId) {
        return res.status(400).json({ error: "studentId is required" });
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
        const result = db.prepare(updateQuery).run(overallPerformance, studentId);

        if (result.changes === 0) {
            return res.status(404).json({ error: `No report found for student ID ${studentId}` });
        }

        res.json({ message: `Evaluation for student ID: ${studentId} updated successfully.` });
    } catch (error) {
        return res.status(500).json({ error: `Could not update evaluation for student ID ${studentId}.` });
    }
});

router.patch(`/uploadEvaluationFile/:id`, requireAuth, (req, res) => {
    const studentID = req.params.id;
    const evaluationFile = req.file;

    if (!evaluationFile) {
        return res.status(400).json({ error: "No file uploaded."});
    }

    const updateQuery = `
        UPDATE reports
        SET evaluation_filename = ?, evaluation_path = ?, evaluation_uploaded = 1, evaluation_status = 'Evaluated'
        WHERE studentID = ?
    `;

    try {
        const result = db.prepare(updateQuery).run(`${studentID}_evaluation.pdf`, evaluationFile.path, studentID);

        if (result.changes === 0) {
            return res.status(404).json({ error: `No report found for student ID: ${studentID}`});
        }

        res.json({ message: `Evaluation file for student ID: ${studentID} uploaded successfully.`});
    } catch (error) {
        return res.status(500).json({ error: `Could not upload evaluation file for student ID: ${studentID}`});
    }
})

module.exports = router;