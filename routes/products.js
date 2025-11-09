// routes/products.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const { ensureAuth, ensureRole } = require("../middleware/auth");
// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// public: product grid
router.get("/", async (req, res) => {
  try {
    const { q, category, min, max } = req.query;
    let filter = { isAvailable: true };
    if (q) filter.title = new RegExp(q, "i");
    if (category) filter.category = category;
    if (min || max) filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);

    const products = await Product.find(filter).populate("seller");
    res.render("products/index", { products });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

// product detail
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("seller");
    if (!product) return res.redirect("/products");
    res.render("products/show", { product });
  } catch (err) {
    console.error(err);
    res.redirect("/products");
  }
});

// seller: new product form
router.get("/new", ensureAuth, ensureRole("seller"), (req, res) => {
  res.render("products/new");
});

// create product
router.post(
  "/",
  ensureAuth,
  ensureRole("seller"),
  upload.array("images", 4),
  async (req, res) => {
    try {
      const { title, description, price, category } = req.body;
      const images =
        req.files && req.files.length
          ? req.files.map((f) => "/uploads/" + f.filename)
          : [];
      const product = new Product({
        title,
        description,
        price,
        category,
        images,
        seller: req.session.user.id,
      });
      await product.save();
      res.redirect("/products");
    } catch (err) {
      console.error(err);
      res.redirect("/products/new");
    }
  }
);

// edit form
router.get("/:id/edit", ensureAuth, ensureRole("seller"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect("/products");
    if (String(product.seller) !== req.session.user.id)
      return res.status(403).send("Forbidden");
    res.render("products/edit", { product });
  } catch (err) {
    console.error(err);
    res.redirect("/products");
  }
});

// update
router.put(
  "/:id",
  ensureAuth,
  ensureRole("seller"),
  upload.array("images", 4),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.redirect("/products");
      if (String(product.seller) !== req.session.user.id)
        return res.status(403).send("Forbidden");

      const { title, description, price, category, isAvailable } = req.body;
      if (req.files && req.files.length)
        product.images = req.files.map((f) => "/uploads/" + f.filename);
      product.title = title;
      product.description = description;
      product.price = price;
      product.category = category;
      product.isAvailable =
        isAvailable !== undefined ? Boolean(isAvailable) : product.isAvailable;
      await product.save();
      res.redirect("/products/" + product._id);
    } catch (err) {
      console.error(err);
      res.redirect("/products");
    }
  }
);

// delete
router.delete("/:id", ensureAuth, ensureRole("seller"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect("/products");
    if (String(product.seller) !== req.session.user.id)
      return res.status(403).send("Forbidden");
    await product.remove();
    res.redirect("/products");
  } catch (err) {
    console.error(err);
    res.redirect("/products");
  }
});

module.exports = router;
