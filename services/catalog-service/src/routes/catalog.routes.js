const express = require("express");
const Category = require("../models/Category");
const Product = require("../models/Product");

const router = express.Router();

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .lean();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category }).lean();
      if (!categoryDoc) {
        return res.json({ items: [], total: 0 });
      }
      query.category = categoryDoc._id;
    }

    if (search) {
      const pattern = new RegExp(search, "i");
      query.$or = [{ name: pattern }, { description: pattern }];
    }

    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({ items, total, page: safePage, limit: safeLimit });
  } catch (err) {
    next(err);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { q = "" } = req.query;
    const pattern = new RegExp(q, "i");

    const items = await Product.find({
      isActive: true,
      $or: [{ name: pattern }, { description: pattern }]
    })
      .limit(20)
      .lean();

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
