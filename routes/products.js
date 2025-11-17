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
console.log("📦 Products route file loaded");
// routes/products.js - DEBUG VERSION

// public: product grid - WITH DEBUGGING
router.get("/", async (req, res) => {
  console.log("🔥🔥🔥 PRODUCTS ROUTE HIT! 🔥🔥🔥");
  try {
    const { q, category, min, max } = req.query;

    // FIRST: Check if ANY products exist at all
    const totalProducts = await Product.countDocuments({});
    console.log("=== PRODUCTS DEBUG ===");
    console.log("Total products in database:", totalProducts);

    // Check products with isAvailable = true
    const availableProducts = await Product.countDocuments({
      isAvailable: true,
    });
    console.log("Products with isAvailable=true:", availableProducts);

    // Build filter
    let filter = { isAvailable: true };
    if (q) filter.title = new RegExp(q, "i");
    if (category) filter.category = category;
    if (min || max) filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);

    console.log("Applied filter:", JSON.stringify(filter));

    // Get products with filter
    const products = await Product.find(filter).populate("seller");
    console.log("Products found with filter:", products.length);

    // Log first product details if exists
    if (products.length > 0) {
      console.log("Sample product:", {
        id: products[0]._id,
        title: products[0].title,
        price: products[0].price,
        category: products[0].category,
        isAvailable: products[0].isAvailable,
        images: products[0].images,
      });
    }

    // Also fetch ALL products (without filter) to see what's there
    const allProducts = await Product.find({}).populate("seller");
    console.log("ALL products (no filter):", allProducts.length);
    if (allProducts.length > 0 && allProducts.length !== products.length) {
      console.log("Sample of filtered-out product:", {
        id: allProducts[0]._id,
        title: allProducts[0].title,
        isAvailable: allProducts[0].isAvailable,
        category: allProducts[0].category,
      });
    }
    console.log("===================");

    res.render("products/index", {
      products,
      query: q || "",
      category: category || "",
      minPrice: min || "",
      maxPrice: max || "",
    });
  } catch (err) {
    console.error("ERROR in /products route:", err);
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

// create product - ENSURE isAvailable is set
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
        isAvailable: true, // EXPLICITLY SET TO TRUE
      });
      await product.save();
      console.log(
        "Product created:",
        product._id,
        "isAvailable:",
        product.isAvailable
      );
      res.redirect("/products");
    } catch (err) {
      console.error("Error creating product:", err);
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
