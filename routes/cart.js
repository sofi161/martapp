// routes/cart.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const ensureAuth = require("../middleware/auth");

// ensure cart existence in session
function ensureCart(req) {
  if (!req.session.cart)
    req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
  return req.session.cart;
}

// add to cart
router.post("/add/:id", ensureAuth, async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.redirect("/products");
    const cart = ensureCart(req);
    const id = prod._id.toString();
    const qty = Number(req.body.qty) || 1;

    if (!cart.items[id]) {
      cart.items[id] = {
        item: {
          _id: prod._id,
          title: prod.title,
          price: prod.price,
          images: prod.images,
        },
        qty,
        price: prod.price * qty,
      };
    } else {
      cart.items[id].qty += qty;
      cart.items[id].price += prod.price * qty;
    }
    cart.totalQty += qty;
    cart.totalPrice = Object.values(cart.items).reduce(
      (sum, it) => sum + it.price,
      0
    );

    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    res.redirect("/products");
  }
});

// view cart
router.get("/", ensureAuth, (req, res) => {
  const cart = req.session.cart || { items: {}, totalQty: 0, totalPrice: 0 };
  res.render("cart/index", { cart });
});

// update qty
router.post("/update/:id", ensureAuth, (req, res) => {
  const cart = ensureCart(req);
  const id = req.params.id;
  const newQty = Number(req.body.qty) || 1;
  if (!cart.items[id]) return res.redirect("/cart");
  const unitPrice = cart.items[id].item.price;
  cart.totalQty += newQty - cart.items[id].qty;
  cart.items[id].qty = newQty;
  cart.items[id].price = unitPrice * newQty;
  cart.totalPrice = Object.values(cart.items).reduce((s, i) => s + i.price, 0);
  res.redirect("/cart");
});

// remove item
router.post("/remove/:id", ensureAuth, (req, res) => {
  const cart = ensureCart(req);
  const id = req.params.id;
  if (cart.items[id]) {
    cart.totalQty -= cart.items[id].qty;
    delete cart.items[id];
    cart.totalPrice = Object.values(cart.items).reduce(
      (s, i) => s + i.price,
      0
    );
  }
  res.redirect("/cart");
});

module.exports = router;
