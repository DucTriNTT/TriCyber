import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import { SAMPLE_PRODUCTS } from './data/products.js';

dotenv.config();

const importData = async () => {
  try {
    console.log('⏳ Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Kết nối thành công!');

    await Product.deleteMany();

    await Product.insertMany(SAMPLE_PRODUCTS);

    console.log('✅ Đã nạp thành công 40 sản phẩm vào cơ sở dữ liệu MongoDB Atlas!');
    process.exit();
  } catch (error) {
    console.error('❌ Lỗi khi nạp dữ liệu:', error);
    process.exit(1);
  }
};

importData();