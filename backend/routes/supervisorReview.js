const express = require('express');
const router = express.Router();
const db = require(`../config/applicants`);
const requireAuth = require(`../middleware/requireAuth`);

router.get(`/supervisor/students`, requireAuth, (req, res) => {
    const supervisorId = req.user.id;
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

module.exports = router;