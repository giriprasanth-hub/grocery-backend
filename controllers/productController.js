const Product = require("../models/Product");

// ============================
// GET ALL ACTIVE PRODUCTS (ADMIN)
// ============================
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ============================
// BULK ADD PRODUCTS
// ============================
exports.addBulkProducts = async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid product array" });
    }

    const formattedProducts = products.map((p) => {
      if (
        !p.name ||
        !p.category ||
        p.mrp == null ||
        p.sellingPrice == null ||
        p.purchasePrice == null ||
        p.stock == null
      ) {
        throw new Error("Missing fields in one or more products");
      }

      return {
        name: p.name,
        category: p.category,
        mrp: p.mrp,
        sellingPrice: p.sellingPrice,
        purchasePrice: p.purchasePrice,
        stock: p.stock,
        image: p.image || "",
        isActive: true,
      };
    });

    await Product.insertMany(formattedProducts);

    res.status(201).json({
      message: "Bulk products added successfully",
      count: formattedProducts.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Bulk insert failed",
      error: error.message,
    });
  }
};

// ============================
// ADD SINGLE PRODUCT (ADMIN)
// ============================
exports.addProduct = async (req, res) => {
  try {
    const { name, category, mrp, sellingPrice, purchasePrice, stock, image } =
      req.body;

    if (
      !name ||
      !category ||
      mrp == null ||
      sellingPrice == null ||
      purchasePrice == null ||
      stock == null
    ) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const product = await Product.create({
      name,
      category,
      mrp,
      sellingPrice,
      purchasePrice,
      stock,
      image: image || "",
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to add product" });
  }
};

// ============================
// LOW STOCK COUNT
// ============================
exports.getLowStockCount = async (req, res) => {
  try {
    const count = await Product.countDocuments({ stock: { $lte: 5 } });
    res.json({ count });
  } catch {
    res.status(500).json({ message: "Failed to fetch low stock count" });
  }
};

// ============================
// DELETE PRODUCT (SOFT DELETE)
// ============================
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await Product.findByIdAndUpdate(id, { isActive: false });

    res.json({ message: "Product removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// ============================
// UPDATE PRODUCT (ADMIN)
// ============================
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { mrp, sellingPrice, purchasePrice, stock } = req.body;

    if (mrp == null || sellingPrice == null || purchasePrice == null || stock == null) {
      return res.status(400).json({
        message: "MRP, selling price, purchase price and stock are required",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.mrp = mrp;
    product.sellingPrice = sellingPrice;
    product.purchasePrice = purchasePrice;
    product.stock = stock;

    await product.save(); // will auto recalc discount

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update product",
    });
  }
};

// ============================
// CUSTOMER PRODUCTS (FLUTTER)
// ============================
exports.getActiveProductsForCustomer = async (req, res) => {
  try {
    const products = await Product.find(
      { isActive: true, stock: { $gt: 0 } },
      {
        name: 1,
        category: 1,
        mrp: 1,
        sellingPrice: 1,
        discountAmount: 1,
        discountPercent: 1,
        image: 1,
        stock: 1,
      }
    );

    const formatted = products.map((p) => ({
      _id: p._id,
      name: p.name,
      category: p.category,
      image: p.image,
      stock: p.stock,

      mrp: p.mrp,
      price: p.sellingPrice, // Flutter uses `price`
      discountAmount: p.discountAmount,
      discountPercent: p.discountPercent,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load products" });
  }
};
