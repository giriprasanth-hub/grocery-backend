const Category = require('../models/Category');

// GET ALL CATEGORIES
exports.getCategories = async (req, res) => {
  // The 'image' field will now automatically be included in the response
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json(categories);
};

// ADD CATEGORY (Updated to accept image)
exports.addCategory = async (req, res) => {
  const { name, image } = req.body; // 👈 Receive image from request

  if (!name) {
    return res.status(400).json({ message: 'Category name required' });
  }

  const exists = await Category.findOne({ name });

  if (exists) {
    return res.status(400).json({ message: 'Category already exists' });
  }

  const category = new Category({ 
    name, 
    image: image || "" // 👈 Save the image URL
  });
  
  await category.save();

  res.status(201).json(category);
};

// DELETE (No changes needed)
exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'Category removed' });
};