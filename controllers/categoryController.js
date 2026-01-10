const Category = require('../models/Category');

// GET ALL CATEGORIES
exports.getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json(categories);
};

// ADD CATEGORY
exports.addCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Category name required' });
  }

  const exists = await Category.findOne({ name });

  if (exists) {
    return res.status(400).json({ message: 'Category already exists' });
  }

  const category = new Category({ name });
  await category.save();

  res.status(201).json(category);
};

// DELETE (SOFT DELETE)
exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'Category removed' });
};
