const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { connectMongo } = require("../src/db/mongo");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const categories = [
  { name: "Electronics", slug: "electronics" },
  { name: "Fashion", slug: "fashion" },
  { name: "Home & Garden", slug: "home-garden" },
  { name: "Sports", slug: "sports" }
];

const products = [
  {
    name: "Premium Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 299.99,
    categorySlug: "electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
  },
  {
    name: "Smart Watch Pro",
    description: "Advanced smartwatch with health tracking features",
    price: 399.99,
    categorySlug: "electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
  },
  {
    name: "Comfort Running Shoes",
    description: "Lightweight running shoes with extra cushioning",
    price: 129.99,
    categorySlug: "sports",
    imageUrl:
      "https://images.unsplash.com/photo-1528701800489-20be3c88a56b?w=400"
  },
  {
    name: "Minimalist Desk Lamp",
    description: "Modern desk lamp with adjustable brightness",
    price: 59.99,
    categorySlug: "home-garden",
    imageUrl:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"
  },
  {
    name: "Classic Denim Jacket",
    description: "Everyday denim jacket with a timeless fit",
    price: 89.99,
    categorySlug: "fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"
  }
];

const seed = async () => {
  try {
    await connectMongo();

    if (process.env.SEED_RESET === "true") {
      await Product.deleteMany({});
      await Category.deleteMany({});
    }

    const categoryMap = {};

    for (const category of categories) {
      const doc = await Category.findOneAndUpdate(
        { slug: category.slug },
        { ...category, isActive: true },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      categoryMap[category.slug] = doc;
    }

    for (const product of products) {
      const categoryDoc = categoryMap[product.categorySlug];
      if (!categoryDoc) continue;

      await Product.findOneAndUpdate(
        { name: product.name, category: categoryDoc._id },
        {
          name: product.name,
          description: product.description,
          price: product.price,
          category: categoryDoc._id,
          imageUrl: product.imageUrl,
          isActive: true
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    console.log("Catalog seed complete");
  } catch (error) {
    console.error("Catalog seed failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();
