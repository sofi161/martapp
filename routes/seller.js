const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const sellerController = require("../controllers/sellerController");
const { ensureAuth, ensureRole } = require("../middleware/auth");

// Middleware to check if user is authenticated and is a seller
router.use(ensureAuth);
router.use(ensureRole("seller"));

// Dashboard Overview
router.get("/dashboard", sellerController.getDashboard);

// Product Management
router.get("/products", sellerController.getProducts);
router.get("/products/add", sellerController.getAddProduct);
router.get("/products/edit/:id", sellerController.getEditProduct);
router.post("/products/edit/:id", sellerController.postEditProduct);
router.post("/products/delete/:id", sellerController.deleteProduct);
router.post("/products/toggle/:id", sellerController.toggleProductStatus);

// Add product route with image upload
router.post(
  "/products/add",
  upload.array("images", 5),
  sellerController.postAddProduct
);

// Order Management
router.get("/orders", sellerController.getOrders);
router.get("/orders/:id", sellerController.getOrderDetails);
router.post("/orders/:id/update-status", sellerController.updateOrderStatus);

router.get("/analytics", sellerController.getAnalytics);
router.get("/inventory", sellerController.getInventory);
router.post("/inventory/:id", sellerController.updateInventory);
router.get("/profile", sellerController.getProfile);
router.post("/profile", sellerController.updateProfile);

module.exports = router;
