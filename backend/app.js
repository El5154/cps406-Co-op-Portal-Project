const express = require("express");
const session = require("express-session");
const cors = require("cors");

const registerRoutes = require("./routes/register");
const loginRoutes = require("./routes/login");
const coordinatorReviewRoutes = require("./routes/coordinatorReview");
const applicantReviewRoutes = require("./routes/applicantReview");
const uploadReportRoutes = require("./routes/uploadReport");
const reviewReportRoutes = require("./routes/reviewReport");
const deadlineRoutes = require("./routes/setDeadline");
const supervisorReviewRoutes = require("./routes/supervisorReview");

const app = express();

app.set("trust proxy", 1);
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://el5154.github.io"
  ],
  credentials: true
}));

const isProduction = process.env.NODE_ENV === "production";

app.use(session({
  secret: "your-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax"
  }
}));

app.use(registerRoutes);
app.use(loginRoutes);
app.use(coordinatorReviewRoutes);
app.use(applicantReviewRoutes);
app.use(uploadReportRoutes);
app.use(reviewReportRoutes);  
app.use(deadlineRoutes);
app.use(supervisorReviewRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});

module.exports = app;