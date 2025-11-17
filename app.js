const dotenv = require("dotenv");
require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");

const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const sellerRoutes = require("./routes/seller");

const app = express();

// connect DB
connectDB();

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// static & uploads
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

const sessionMiddleware = require("./middleware/sessionMiddleware");
app.use(sessionMiddleware);

// Attach user to req.user and res.locals for all routes
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    res.locals.user = req.session.user;
  }
  next();
});

// routes
console.log("🚀 Registering /products routes");
app.use("/products", productRoutes);
console.log("🚀 Registering /cart routes");
app.use("/cart", cartRoutes);
console.log("🚀 Registering /orders routes");
app.use("/orders", orderRoutes);
console.log("🚀 Registering /seller routes");
app.use("/seller", sellerRoutes);

// home route
app.get("/", (req, res) => {
  res.redirect("/products");
});

app.use("/", authRoutes);

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render("error", { message: "Page not found" });
});

app.use(function (err, req, res, next) {
  console.error(err.stack);

  // try to render error view, but fall back to JSON if rendering fails
  res.status(err.status || 500);
  try {
    return res.render("error", { error: err });
  } catch (renderErr) {
    // rendering failed (missing view, etc.) — send JSON fallback
    return res.json({
      success: false,
      status: err.status || 500,
      message: err.message || "Internal Server Error",
      stack: req.app.get("env") === "development" ? err.stack : undefined,
    });
  }
});

// server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Seller Dashboard: http://localhost:${PORT}/seller/dashboard`);
});

module.exports = app;
