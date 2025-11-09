// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, default: "Anonymous" },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
