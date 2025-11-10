// middleware/sessionMiddleware.js
// This middleware makes user and cart data available to all views

const sessionMiddleware = (req, res, next) => {
  // Make user available to all views
  res.locals.user = req.session.user || null;

  // Make cart count available to all views
  res.locals.cartCount = req.session.cart ? req.session.cart.length : 0;

  // Make success/error messages available (optional)
  res.locals.successMessage = req.session.success || null;
  res.locals.errorMessage = req.session.error || null;

  // Clear flash messages after they're set in locals
  delete req.session.success;
  // Note: We don't delete req.session.error here because
  // it's handled in the auth routes

  next();
};

module.exports = sessionMiddleware;
