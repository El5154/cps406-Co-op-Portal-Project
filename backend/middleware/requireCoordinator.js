function requireCoordinator(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "You must be logged in" });
  }

  if (req.session.user.role !== "coordinator") {
    return res.status(403).json({ error: "Coordinator access only" });
  }

  next();
}

module.exports = requireCoordinator;