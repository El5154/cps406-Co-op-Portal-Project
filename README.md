# CPS406 Co-op Portal Project

A full-stack **Co-op Support Application** built for managing the student co-op workflow from registration to final report and supervisor evaluation.

To Run open https://co-op-portal-cps406.onrender.com.
Then open this github page deployment page.

## Overview

This project helps support the co-op process for three main user roles:

- **Applicants** can register, log in, view their application status, and upload their work-term report.
- **Coordinators** can review applicants, assign provisional/final decisions, assign supervisors, set deadlines, and review submitted reports.
- **Supervisors** can view assigned students, submit evaluation results, and upload evaluation files.

The application is split into:

- **Frontend (`docs/`)**  
  Static HTML, CSS, and JavaScript pages intended for GitHub Pages hosting.
- **Backend (`backend/`)**  
  Node.js + Express server with SQLite for data storage and session-based authentication.

---

## Features

### Applicant Features
- Register with:
  - Name
  - 9-digit student ID
  - `@torontomu.ca` email
  - Password
- Log in and log out
- View dashboard with:
  - Provisional status
  - Final status
  - Report status
  - Evaluation status
  - Deadline
  - Upload timestamp
- Upload work-term report as a PDF

### Coordinator Features
- View all applicants
- Update provisional status
- Finalize applicant decisions
- Assign supervisors
- Set report deadlines
- View missed deadlines
- Review applicant report details
- Access uploaded report/evaluation files

### Supervisor Features
- View assigned students
- Submit evaluation status
- Upload evaluation PDF files

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express
- better-sqlite3
- express-session
- cors
- multer

### Testing
- Jest
- Supertest

---

## Project Structure

```bash
cps406-Co-op-Portal-Project/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── test/
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── applicants.db
├── docs/
│   ├── index.html
│   ├── register.html
│   ├── login.html
│   ├── applicant-dashboard.html
│   ├── coordinator.html
│   ├── reviewReport.html
│   ├── supervisor.html
│   ├── evaluation.html
│   └── related CSS/JS files
└── README.md
