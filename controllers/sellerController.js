const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

// Get seller ID helper
const getSellerId = (req) => {
  return (
    req.user._id || req.user.id || req.session.user._id || req.session.user.id
  );
};

// Dashboard Overview
exports.getDashboard = async (req, res) => {
  try {
    const sellerId = getSellerId(req);

    // Get statistics
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const activeProducts = await Product.countDocuments({
      seller: sellerId,
      status: "active",
    });

    // Get orders for this seller's products
    const orders = await Order.find({ "items.seller": sellerId })
      .populate("items.product")
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate revenue
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;

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

    // Get low stock products
    const lowStockProducts = await Product.find({
      seller: sellerId,
      stock: { $lt: 10 },
    }).limit(5);

    // Get recent products
    const recentProducts = await Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5);

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
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("seller/products", {
      title: "My Products",
      products,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
  }
};

// Get add product form
exports.getAddProduct = (req, res) => {
  res.render("seller/add-product", { title: "Add New Product" });
};

// Post new product
exports.postAddProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, images } = req.body;
    const sellerId = getSellerId(req);

    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      images: images ? images.split(",").map((img) => img.trim()) : [],
      seller: sellerId,
      status: "active",
    });

    await product.save();
    res.redirect("/seller/products");
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Failed to add product" });
  }
};

// Get edit product form
exports.getEditProduct = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
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
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
  }
};

// Post edit product
exports.postEditProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, images } = req.body;
    const sellerId = getSellerId(req);

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: sellerId },
      {
        name,
        description,
        price,
        category,
        stock,
        images: images ? images.split(",").map((img) => img.trim()) : [],
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).render("error", { message: "Product not found" });
    }

    res.redirect("/seller/products");
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Failed to update product" });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    await Product.findOneAndDelete({
      _id: req.params.id,
      seller: sellerId,
    });
    res.redirect("/seller/products");
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Failed to delete product" });
  }
};

// Toggle product status
exports.toggleProductStatus = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const product = await Product.findOne({
      _id: req.params.id,
      seller: sellerId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.status = product.status === "active" ? "inactive" : "active";
    await product.save();

    res.json({ success: true, status: product.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get orders
exports.getOrders = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const orders = await Order.find({ "items.seller": sellerId })
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.render("seller/orders", {
      title: "Orders",
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
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
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const sellerId = getSellerId(req);

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
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
  }
};

// Get inventory
exports.getInventory = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const products = await Product.find({ seller: sellerId }).sort({
      stock: 1,
    });

    res.render("seller/inventory", {
      title: "Inventory Management",
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
  }
};

// Update inventory
exports.updateInventory = async (req, res) => {
  try {
    const { stock } = req.body;
    const sellerId = getSellerId(req);

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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const seller = await User.findById(sellerId);
    res.render("seller/profile", {
      title: "Seller Profile",
      seller,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Server error" });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, shopName, shopDescription } = req.body;
    const sellerId = getSellerId(req);

    await User.findByIdAndUpdate(sellerId, {
      name,
      email,
      phone,
      shopName,
      shopDescription,
    });

    res.redirect("/seller/profile");
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Failed to update profile" });
  }
};
