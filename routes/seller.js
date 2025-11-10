const express = require("express");
const router = express.Router();
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
router.post("/products/add", sellerController.postAddProduct);
router.get("/products/edit/:id", sellerController.getEditProduct);
router.post("/products/edit/:id", sellerController.postEditProduct);
router.post("/products/delete/:id", sellerController.deleteProduct);
router.post(
  "/products/toggle-status/:id",
  sellerController.toggleProductStatus
);

// Order Management
router.get("/orders", sellerController.getOrders);
router.get("/orders/:id", sellerController.getOrderDetails);
router.post("/orders/:id/update-status", sellerController.updateOrderStatus);

// Analytics
router.get("/analytics", sellerController.getAnalytics);

// Inventory
router.get("/inventory", sellerController.getInventory);
router.post("/inventory/update/:id", sellerController.updateInventory);

// Profile & Settings
router.get("/profile", sellerController.getProfile);
router.post("/profile", sellerController.updateProfile);

module.exports = router;
