const express = require("express");
const session = require("express-session");
const cors = require("cors");

const registerRoutes = require("./routes/register");
const loginRoutes = require("./routes/login");
const coordinatorReviewRoutes = require("./routes/coordinatorReview");
const applicantReviewRoutes = require("./routes/applicantReview");
const requireAuth = require("./middleware/requireAuth");

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  credentials: true
}));

app.use(session({
  secret: "cps420-coop-portal-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    sameSite: "lax"
  }
}));

app.use(registerRoutes);
app.use(loginRoutes);
app.use(coordinatorReviewRoutes);
app.use(applicantReviewRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});

app.get("/dashboard", requireAuth, (req, res) => {
  res.status(200).json({ message: `Welcome, ${req.session.user.username}!` });
}
);

module.exports = app;