const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                name: String,
                price: Number,
                quantity: Number,
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String, default: 'COD',
        },
        status: {
            type: String,
            enum: [
                'Pending',
                'Preparing',
                'Packed',
                'Delivered',
                'Delivery Failed',
                'Returned',
                'Cancelled'
            ],
            default: 'Pending'
        }


    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
