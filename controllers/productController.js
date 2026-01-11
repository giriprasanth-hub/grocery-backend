const Product = require('../models/Product');

// GET all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

exports.addBulkProducts = async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Invalid product array' });
    }

    const formattedProducts = products.map(p => {
      if (!p.name || !p.price || !p.category || p.stock === undefined) {
        throw new Error('Missing fields in one or more products');
      }

      return {
        name: p.name,
        price: p.price,
        category: p.category,
        stock: p.stock,
        image: p.image || '',
        isActive: true,
      };
    });

    await Product.insertMany(formattedProducts);

    res.status(201).json({
      message: 'Bulk products added successfully',
      count: formattedProducts.length,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Bulk insert failed',
      error: error.message,
    });
  }
};

// ADD new product (admin)
exports.addProduct = async (req, res) => {
  try {
    const { name, price, category, stock, image } = req.body;

    if (!name || !price || !category || stock == null) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const product = await Product.create({
      name,
      price,
      category,
      stock,
      image: image || '',
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product' });
  }
};

exports.getLowStockCount = async (req, res) => {
  try {
    const count = await Product.countDocuments({ stock: { $lte: 5 } });
    res.json({ count });
  } catch {
    res.status(500).json({ message: 'Failed to fetch low stock count' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
};


// UPDATE PRODUCT (price + stock)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, stock } = req.body;

    if (price == null || stock == null) {
      return res.status(400).json({
        message: 'Price and stock are required',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    product.price = price;
    product.stock = stock;

    await product.save();

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update product',
    });
  }
};

exports.getActiveProductsForCustomer = async (req, res) => {
  try {
    const products = await Product.find(
      { isActive: true, stock: { $gt: 0 } },
      {
        name: 1,
        category: 1,
        price: 1,          // original selling price
        mrp: 1,
        discountAmount: 1,
        discountPercent: 1,
        image: 1,
        stock: 1,
      }
    );

    // 🔥 Convert DB format → Flutter format
    const formatted = products.map((p) => {
      const mrp = p.mrp || p.price;
      const sellingPrice = p.price;

      const discountAmount = mrp - sellingPrice;
      const discountPercent =
        mrp > 0 ? Math.round((discountAmount / mrp) * 100) : 0;

      return {
        _id: p._id,
        name: p.name,
        category: p.category,
        image: p.image,
        stock: p.stock,

        mrp: mrp,
        sellingPrice: sellingPrice,
        discountAmount: discountAmount,
        discountPercent: discountPercent,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load products' });
  }
};

