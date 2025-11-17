const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const mongoose = require("mongoose");

// Get seller ID helper - FIXED to handle both string and ObjectId
const getSellerId = (req) => {
  const id =
    req.user?._id ||
    req.user?.id ||
    req.session?.user?._id ||
    req.session?.user?.id;

  // Always return the ID as-is first, we'll convert in queries
  return id ? id.toString() : null;
};

// Dashboard Overview - FIXED
exports.getDashboard = async (req, res) => {
  try {
    let sellerId = getSellerId(req);
    console.log("Dashboard - Original Seller ID:", sellerId);
    console.log("Dashboard - Original Type:", typeof sellerId);

    // Convert to ObjectId if it's a string
    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    console.log("Dashboard - Converted Seller ID:", sellerId);

    // 🔍 DEBUG: Check what's in the database
    const allProducts = await Product.find({});
    console.log("=== ALL PRODUCTS IN DB ===");
    console.log("Total products in entire DB:", allProducts.length);
    if (allProducts.length > 0) {
      console.log("First product seller field:", allProducts[0].seller);
      console.log("First product seller type:", typeof allProducts[0].seller);
      console.log(
        "Full first product:",
        JSON.stringify(allProducts[0], null, 2)
      );
    }

    // Check if any product matches
    const matchingProducts = await Product.find({
      seller: sellerId,
    });
    console.log("Products matching seller:", matchingProducts.length);

    // Try string comparison
    const stringMatch = await Product.find({
      seller: sellerId.toString(),
    });
    console.log("Products matching seller as string:", stringMatch.length);

    // Get statistics
    const totalProducts = await Product.countDocuments({
      seller: sellerId.toString(),
    });
    console.log("Dashboard - Total products:", totalProducts);

    const activeProducts = await Product.countDocuments({
      seller: sellerId,
      status: "active",
    });

    // Initialize revenue and order counters
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;

    // Get all orders for this seller's products
    const allOrders = await Order.find({ "items.seller": sellerId });

    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.seller && item.seller.toString() === sellerId.toString()) {
          totalRevenue += item.price * item.quantity;
          if (order.status === "pending") pendingOrders++;
          if (order.status === "delivered") completedOrders++;
        }
      });
    });

    // Get recent orders for display
    const orders = await Order.find({ "items.seller": sellerId })
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get low stock products
    const lowStockProducts = await Product.find({
      seller: sellerId,
      stock: { $lt: 10 },
    })
      .sort({ stock: 1 })
      .limit(5)
      .lean();

    // Get recent products
    const recentProducts = await Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log("Dashboard - Recent products:", recentProducts.length);

    // Get all products
    const products = await Product.find({ seller: sellerId });
    console.log("Dashboard - All products:", products.length);

    res.render("seller/dashboard", {
      title: "Seller Dashboard",
      stats: {
        totalProducts,
        activeProducts,
        totalRevenue,
        pendingOrders,
        completedOrders,
      },
      recentOrders: orders,
      lowStockProducts,
      recentProducts,
      products,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res
      .status(500)
      .render("error", { message: "Server error: " + error.message });
  }
};

// Get all products - FIXED
exports.getProducts = async (req, res) => {
  try {
    let sellerId = getSellerId(req);

    // Convert to ObjectId if it's a string
    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const totalPages = Math.ceil(totalProducts / limit);

    console.log("Products page - Products found:", products.length);
    console.log("Products page - Total products:", totalProducts);

    res.render("seller/products", {
      title: "My Products",
      products,
      currentPage: page,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    console.error("Products page error:", error);
    res
      .status(500)
      .render("error", { message: "Server error: " + error.message });
  }
};

// Get add product form
exports.getAddProduct = (req, res) => {
  res.render("seller/add-product", { title: "Add New Product" });
};

// Post new product - STORES BASE64 IMAGES - FIXED

exports.postAddProduct = async (req, res) => {
  try {
    const sellerId = getSellerId(req);

    const newProduct = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      images: req.files.map(
        (f) => `data:${f.mimetype};base64,${f.buffer.toString("base64")}`
      ),
      stock: req.body.stock || 0,
      seller: new mongoose.Types.ObjectId(sellerId), // ✅ fix here
    });

    await newProduct.save();
    console.log("✅ Product saved:", newProduct);
    res.redirect("/seller/products");
  } catch (error) {
    console.error("❌ Error adding product:", error);
    res.status(500).render("error", { message: "Failed to add product" });
  }
};
// Get edit product form - FIXED
exports.getEditProduct = async (req, res) => {
  try {
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    const product = await Product.findOne({
      _id: req.params.id,
      seller: sellerId,
    });

    if (!product) {
      return res.status(404).render("error", { message: "Product not found" });
    }

    res.render("seller/edit-product", {
      title: "Edit Product",
      product,
    });
  } catch (error) {
    console.error("Edit product error:", error);
    res
      .status(500)
      .render("error", { message: "Server error: " + error.message });
  }
};

// Post edit product - FIXED
exports.postEditProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    // Get existing product to preserve images if no new images uploaded
    const existingProduct = await Product.findOne({
      _id: req.params.id,
      seller: sellerId,
    });

    if (!existingProduct) {
      console.log("❌ Product not found for seller:", sellerId);
      return res.status(404).render("error", { message: "Product not found" });
    }

    // Handle new images if uploaded
    let images = existingProduct.images;
    if (req.files && req.files.length > 0) {
      console.log("✅ New images uploaded:", req.files.length);
      images = [];
      req.files.forEach((file) => {
        const base64Image = `data:${
          file.mimetype
        };base64,${file.buffer.toString("base64")}`;
        images.push(base64Image);
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: sellerId },
      {
        name,
        description,
        price,
        category,
        stock,
        images,
      },
      { new: true }
    );

    console.log("Product updated:", product._id);
    res.redirect("/seller/products");
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).render("error", {
      message: "Failed to update product: " + error.message,
    });
  }
};

// Delete product - FIXED
exports.deleteProduct = async (req, res) => {
  try {
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    const deletedProduct = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: sellerId,
    });

    if (!deletedProduct) {
      return res.status(404).render("error", { message: "Product not found" });
    }

    console.log("Product deleted:", deletedProduct._id);
    res.redirect("/seller/products");
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).render("error", {
      message: "Failed to delete product: " + error.message,
    });
  }
};

// Toggle product status - FIXED
exports.toggleProductStatus = async (req, res) => {
  try {
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    const product = await Product.findOne({
      _id: req.params.id,
      seller: sellerId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.status = product.status === "active" ? "inactive" : "active";
    await product.save();

    console.log(
      "Product status toggled:",
      product._id,
      "New status:",
      product.status
    );
    res.json({ success: true, status: product.status });
  } catch (error) {
    console.error("Toggle status error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// Get orders - FIXED
exports.getOrders = async (req, res) => {
  try {
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    const orders = await Order.find({ "items.seller": sellerId })
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.render("seller/orders", {
      title: "Orders",
      orders,
    });
  } catch (error) {
    console.error("Orders error:", error);
    res
      .status(500)
      .render("error", { message: "Server error: " + error.message });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product");

    if (!order) {
      return res.status(404).render("error", { message: "Order not found" });
    }

    res.render("seller/order-details", {
      title: "Order Details",
      order,
    });
  } catch (error) {
    console.error("Order details error:", error);
    res
      .status(500)
      .render("error", { message: "Server error: " + error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, status: order.status });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// Get analytics - FIXED
exports.getAnalytics = async (req, res) => {
  try {
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    // Get sales data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orders = await Order.find({
      "items.seller": sellerId,
      createdAt: { $gte: sevenDaysAgo },
    });

    // Process daily sales
    const dailySales = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      if (!dailySales[date]) {
        dailySales[date] = { revenue: 0, orders: 0 };
      }
      order.items.forEach((item) => {
        if (item.seller && item.seller.toString() === sellerId.toString()) {
          dailySales[date].revenue += item.price * item.quantity;
          dailySales[date].orders++;
        }
      });
    });

    // Get top products
    const products = await Product.find({ seller: sellerId })
      .sort({ sales: -1 })
      .limit(5);

    res.render("seller/analytics", {
      title: "Analytics",
      dailySales,
      topProducts: products,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res
      .status(500)
      .render("error", { message: "Server error: " + error.message });
  }
};

// Get inventory - FIXED
exports.getInventory = async (req, res) => {
  try {
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    const products = await Product.find({ seller: sellerId }).sort({
      stock: 1,
    });

    res.render("seller/inventory", {
      title: "Inventory Management",
      products,
    });
  } catch (error) {
    console.error("Inventory error:", error);
    res
      .status(500)
      .render("error", { message: "Server error: " + error.message });
  }
};

// Update inventory - FIXED
exports.updateInventory = async (req, res) => {
  try {
    const { stock } = req.body;
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: sellerId },
      { stock: parseInt(stock) },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, stock: product.stock });
  } catch (error) {
    console.error("Update inventory error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// Get profile - FIXED
exports.getProfile = async (req, res) => {
  try {
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    const seller = await User.findById(sellerId);
    res.render("seller/profile", {
      title: "Seller Profile",
      seller,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res
      .status(500)
      .render("error", { message: "Server error: " + error.message });
  }
};

// Update profile - FIXED
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, shopName, shopDescription } = req.body;
    let sellerId = getSellerId(req);

    if (typeof sellerId === "string") {
      sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    await User.findByIdAndUpdate(sellerId, {
      name,
      email,
      phone,
      shopName,
      shopDescription,
    });

    res.redirect("/seller/profile");
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).render("error", {
      message: "Failed to update profile: " + error.message,
    });
  }
};
