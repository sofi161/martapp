// middleware/auth.js
function ensureAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ message: "Please log in first" });
  }
}

function ensureRole(role) {
  return function (req, res, next) {
    if (req.session && req.session.user && req.session.user.role === role) {
      return next();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  };
}

module.exports = { ensureAuth, ensureRole };
