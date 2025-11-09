// routes/orders.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { ensureAuth } = require("../middleware/auth");

// checkout - create order
router.post("/checkout", ensureAuth, async (req, res) => {
  try {
    const cart = req.session.cart;
    if (!cart || cart.totalQty === 0) return res.redirect("/cart");

    const items = Object.values(cart.items).map((i) => ({
      product: i.item._id,
      qty: i.qty,
      priceAtPurchase: i.item.price,
    }));
    const totalAmount = cart.totalPrice;

    const order = new Order({
      buyer: req.session.user.id,
      items,
      totalAmount,
      status: "pending",
    });
    await order.save();

    // clear cart
    req.session.cart = null;

    res.redirect("/orders/" + order._id + "/success");
  } catch (err) {
    console.error(err);
    res.redirect("/cart");
  }
});

// success page
router.get("/:id/success", ensureAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) return res.redirect("/");
    res.render("orders/success", { order });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

// buyer: list my orders
router.get("/", ensureAuth, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.session.user.id }).populate(
      "items.product"
    );
    res.render("orders/index", { orders });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

module.exports = router;
