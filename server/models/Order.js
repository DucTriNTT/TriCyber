import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    customer: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      note: { type: String, default: '' }
    },
    orderItems: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true }
      }
    ],
    totalPrice: { type: Number, required: true },
    status: { type: String, default: 'Đang xử lý' }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;