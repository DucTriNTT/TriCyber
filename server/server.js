import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Product from './models/Product.js';
import Order from './models/Order.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối cơ sở dữ liệu MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('🍃 Kết nối thành công tới cơ sở dữ liệu MongoDB Atlas!'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB Atlas:', err));

// Route trang chủ API
app.get('/', (req, res) => {
  res.send('Chào mừng đến với Backend API của TriCyber!');
});

// Route kiểm tra trạng thái hoạt động
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'MongoDB Atlas', uptime: process.uptime() });
});

// ==================== AUTH & PROFILE APIs ====================

// API: Đăng ký
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body;

    if (!fullName || !phone || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ tất cả các trường thông tin.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      phone,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer'
    });

    const savedUser = await newUser.save();
    console.log(`👤 Đã tạo tài khoản mới: ${savedUser.email}`);

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng ký tài khoản', error: error.message });
  }
});

// API: Đăng nhập
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Tài khoản chưa được đăng ký. Vui lòng đăng ký tài khoản trước!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu không chính xác. Vui lòng thử lại!' });
    }

    console.log(`🔑 Đăng nhập thành công: ${user.email} (Role: ${user.role || 'customer'})`);

    res.json({
      message: 'Đăng nhập thành công!',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role || 'customer'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: error.message });
  }
});

// API: Cập nhật Profile
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { id, fullName, phone, currentPassword, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedUser = await user.save();

    res.json({
      message: 'Cập nhật thông tin thành công!',
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật hồ sơ cá nhân', error: error.message });
  }
});

// ==================== PRODUCT APIs ====================

// Lấy danh sách sản phẩm
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi truy vấn sản phẩm từ database', error: error.message });
  }
});

// Lấy chi tiết một sản phẩm
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tìm sản phẩm theo ID', error: error.message });
  }
});

// API ADMIN: Thêm sản phẩm mới
app.post('/api/products', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const requester = await User.findById(userId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Từ chối truy cập: Bạn không có quyền thêm sản phẩm!' });
    }

    const { name, category, brand, price, originalPrice, image, specs } = req.body;
    if (!name || !category || !brand || !price) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ tên, danh mục, thương hiệu và giá bán.' });
    }

    const newProduct = new Product({
      id: `prod_${Date.now()}`,
      name,
      category,
      brand,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Number(price),
      rating: 5.0,
      image: image || 'https://placehold.co/600x400/151922/00FFA3?text=TriCyber+Gear',
      specs: specs || {},
      inStock: true
    });

    const saved = await newProduct.save();
    console.log(`🛍️ Admin đã thêm sản phẩm mới: ${saved.name}`);
    res.status(201).json({ message: 'Thêm sản phẩm thành công!', product: saved });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo sản phẩm mới', error: error.message });
  }
});

// API ADMIN: Xóa sản phẩm
app.delete('/api/products/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const requester = await User.findById(userId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Từ chối truy cập: Bạn không có quyền xóa sản phẩm!' });
    }

    const deleted = await Product.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa.' });
    }

    console.log(`🗑️ Admin đã xóa sản phẩm: ${deleted.name}`);
    res.json({ message: 'Đã xóa sản phẩm thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm', error: error.message });
  }
});

// ==================== ORDER APIs ====================

// Đặt hàng
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, orderItems, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng đang trống, không thể tạo đơn hàng' });
    }

    const newOrder = new Order({
      customer,
      orderItems,
      totalPrice,
      status: 'Đang xử lý'
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({ message: 'Đặt hàng thành công!', order: savedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng', error: error.message });
  }
});

// Lấy đơn của user
app.get('/api/orders/user/:phone', async (req, res) => {
  try {
    const orders = await Order.find({ 'customer.phone': req.params.phone }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử mua hàng', error: error.message });
  }
});

// Lấy toàn bộ đơn hàng (Chỉ Admin)
app.get('/api/orders', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    const requester = await User.findById(userId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên!' });
    }

    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng', error: error.message });
  }
});

// Cập nhật trạng thái đơn hàng (Chỉ Admin)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    const requester = await User.findById(userId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên!' });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json({ message: 'Cập nhật trạng thái thành công', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái đơn hàng', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TriCyber Server is running on: http://localhost:${PORT}`);
});