const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes =require('./routes/reportRoutes');
const categoryRoute =require('./routes/categoryRoutes')
const upload =require('./routes/uploadRoute');


const app = express();

// DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories',categoryRoute );
app.use('/uploads', express.static('uploads'));

app.use('/uploads', express.static('uploads'));
app.use('/api/upload-image',upload );



// Test
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
