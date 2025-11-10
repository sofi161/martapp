// middleware/auth.js
function ensureAuth(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user; // Make sure req.user is set
    return next();
  } else {
    return res.redirect("/login"); // Redirect to login page
  }
}

function ensureRole(role) {
  return function (req, res, next) {
    if (req.session && req.session.user && req.session.user.role === role) {
      return next();
    } else {
      return res.status(403).render("error", {
        message: `Access denied. ${
          role.charAt(0).toUpperCase() + role.slice(1)
        } account required.`,
      });
    }
  };
}

module.exports = { ensureAuth, ensureRole };
