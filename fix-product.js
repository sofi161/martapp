// fix-products.js
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/your-database-name";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Update all products to have isAvailable = true and copy name to title
    const result = await Product.updateMany(
      {},
      {
        $set: {
          isAvailable: true,
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} product(s)`);

    // Now copy name to title for all products that don't have title
    const products = await Product.find({ title: { $exists: false } });
    console.log(`Found ${products.length} product(s) without title field`);

    for (let product of products) {
      product.title = product.name;
      await product.save();
      console.log(`  ✓ Set title for product: ${product.name}`);
    }

    // Show all products
    const allProducts = await Product.find({});
    console.log("\n📦 All products in database:");
    allProducts.forEach((p) => {
      console.log({
        id: p._id,
        name: p.name,
        title: p.title,
        price: p.price,
        category: p.category,
        isAvailable: p.isAvailable,
      });
    });

    console.log("\n✅ All done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
