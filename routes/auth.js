// routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// render register
router.get("/register", (req, res) => res.render("auth/register"));

// register post
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.redirect("/register");
    const user = new User({ name, email, password, role });
    await user.save();
    req.session.user = { id: user._id, name: user.name, role: user.role };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/register");
  }
});

// render login
router.get("/login", (req, res) => res.render("auth/login"));

// login post
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.redirect("/login");
    const ok = await user.comparePassword(password);
    if (!ok) return res.redirect("/login");
    req.session.user = { id: user._id, name: user.name, role: user.role };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/login");
  }
});

// logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
