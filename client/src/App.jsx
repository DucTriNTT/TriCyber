import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Cpu, Zap, Star, Filter, 
  X, Plus, Minus, Trash2, ArrowRight, Search, Loader2, CheckCircle2, 
  User as UserIcon, LogOut, AlertCircle, Package, Clock, ShieldCheck, 
  LayoutDashboard, Store, DollarSign, ShoppingBag, ShieldAlert, PlusCircle, Boxes
} from 'lucide-react';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Chế độ xem: 'shop' (Khách hàng) hoặc 'admin' (Quản trị viên)
  const [viewMode, setViewMode] = useState('shop');
  const [adminTab, setAdminTab] = useState('orders'); // 'orders' hoặc 'products'

  // Quản lý Đơn hàng Admin
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Quản lý Sản phẩm Admin (Thêm sản phẩm mới)
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'gaming',
    brand: '',
    price: '',
    originalPrice: '',
    image: '',
    specConnection: '',
    specSensor: ''
  });
  const [productActionLoading, setProductActionLoading] = useState(false);
  const [productMessage, setProductMessage] = useState('');

  // State Đặt hàng
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ fullName: '', phone: '', address: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // State Auth
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authFormData, setAuthFormData] = useState({ fullName: '', phone: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('tricyber_user');
    return saved ? JSON.parse(saved) : null;
  });

  // State Profile
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('info');
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', currentPassword: '', newPassword: '' });
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const isAdmin = currentUser && currentUser.role === 'admin';

  useEffect(() => {
    if (currentUser) {
      setCustomerInfo((prev) => ({
        ...prev,
        fullName: currentUser.fullName || '',
        phone: currentUser.phone || ''
      }));
      setProfileForm({
        fullName: currentUser.fullName || '',
        phone: currentUser.phone || '',
        currentPassword: '',
        newPassword: ''
      });
    } else {
      setViewMode('shop');
    }
  }, [currentUser]);

  // Nạp danh sách sản phẩm
  const fetchProducts = () => {
    setLoading(true);
    const url = selectedCategory === 'all'
      ? 'http://localhost:5000/api/products'
      : `http://localhost:5000/api/products?category=${selectedCategory}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Không thể kết nối đến máy chủ API');
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi nạp sản phẩm:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  // Nạp đơn hàng Admin
  const fetchAdminOrders = async () => {
    if (!currentUser?.id) return;
    setAdminLoading(true);
    setAdminError('');

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể lấy dữ liệu đơn hàng');
      setAdminOrders(data);
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'admin' && isAdmin) {
      fetchAdminOrders();
    }
  }, [viewMode, isAdmin]);

  // Admin cập nhật trạng thái đơn
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Cập nhật trạng thái thất bại');

      setAdminOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert('❌ Lỗi: ' + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Admin thêm sản phẩm mới
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setProductActionLoading(true);
    setProductMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          name: newProductForm.name,
          category: newProductForm.category,
          brand: newProductForm.brand,
          price: Number(newProductForm.price),
          originalPrice: Number(newProductForm.originalPrice || newProductForm.price),
          image: newProductForm.image,
          specs: {
            ketNoi: newProductForm.specConnection || 'Không dây / Có dây',
            camBien: newProductForm.specSensor || 'Quang học cao cấp'
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Thêm sản phẩm thất bại');

      setProductMessage('✅ Thêm sản phẩm mới vào kho thành công!');
      setNewProductForm({
        name: '',
        category: 'gaming',
        brand: '',
        price: '',
        originalPrice: '',
        image: '',
        specConnection: '',
        specSensor: ''
      });
      fetchProducts();
    } catch (err) {
      alert('❌ Lỗi: ' + err.message);
    } finally {
      setProductActionLoading(false);
    }
  };

  // Admin xóa sản phẩm
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" khỏi hệ thống?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xóa sản phẩm thất bại');

      alert('🗑️ ' + data.message);
      fetchProducts();
    } catch (err) {
      alert('❌ Lỗi: ' + err.message);
    }
  };

  // Lấy lịch sử mua hàng
  const fetchUserOrders = async () => {
    if (!currentUser?.phone) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/user/${currentUser.phone}`);
      const data = await res.json();
      setUserOrders(data);
    } catch (err) {
      console.error('Lỗi lấy lịch sử:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleOpenProfile = () => {
    setProfileMessage({ type: '', text: '' });
    setProfileTab('info');
    setIsProfileOpen(true);
    fetchUserOrders();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setProfileLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          fullName: profileForm.fullName,
          phone: profileForm.phone,
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cập nhật thất bại');

      setCurrentUser(data.user);
      localStorage.setItem('tricyber_user', JSON.stringify(data.user));
      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const displayProducts = products.filter((item) =>
    item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authFormData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Đã xảy ra lỗi.');

      setCurrentUser(data.user);
      localStorage.setItem('tricyber_user', JSON.stringify(data.user));
      setIsAuthOpen(false);
      setAuthFormData({ fullName: '', phone: '', email: '', password: '' });
      setAuthError('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tricyber_user');
    setIsProfileOpen(false);
    setViewMode('shop');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.address) {
      alert('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerInfo,
          orderItems: cartItems,
          totalPrice: totalCartPrice
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi khi gửi đơn hàng');

      setOrderSuccess(true);
      setCartItems([]);
      setCustomerInfo({ fullName: currentUser?.fullName || '', phone: currentUser?.phone || '', address: '', note: '' });
      if (viewMode === 'admin' && isAdmin) fetchAdminOrders();
    } catch (err) {
      alert('❌ Lỗi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRevenue = adminOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-200 font-sans selection:bg-[#00FFA3] selection:text-black">
      {/* ================= HEADER / NAVBAR ================= */}
      <header className="border-b border-gray-800 bg-[#151922]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none" 
            onClick={() => { setViewMode('shop'); setSelectedCategory('all'); setSearchKeyword(''); }}
          >
            <Cpu className="text-[#00FFA3] w-7 h-7" />
            <span className="text-xl font-bold tracking-wider text-white">
              TRI<span className="text-[#00FFA3]">CYBER</span>
            </span>
          </div>

          {viewMode === 'shop' && (
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm bàn phím, chuột, Razer, Logitech..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFA3] transition"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                {searchKeyword && (
                  <button 
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setViewMode(viewMode === 'shop' ? 'admin' : 'shop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  viewMode === 'admin'
                    ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/40 hover:bg-yellow-400/20'
                    : 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30 hover:border-yellow-400 hover:bg-yellow-400/20 shadow-md shadow-yellow-400/10'
                }`}
              >
                {viewMode === 'admin' ? (
                  <>
                    <Store className="w-3.5 h-3.5" /> Về Cửa Hàng
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-3.5 h-3.5 text-yellow-400" /> Trang Quản Trị
                  </>
                )}
              </button>
            )}

            {viewMode === 'shop' && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full bg-gray-800/80 hover:bg-gray-700 transition"
                title="Mở giỏ hàng"
              >
                <ShoppingCart className="w-5 h-5 text-gray-200" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#00FFA3] text-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {totalCartCount}
                  </span>
                )}
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenProfile}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-[#00FFA3]/50 transition cursor-pointer"
                  title="Xem hồ sơ & Lịch sử mua hàng"
                >
                  <UserIcon className="w-4 h-4 text-[#00FFA3]" />
                  <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {currentUser.fullName}
                  </span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 ml-1">
                      Admin
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setIsAuthOpen(true);
                }}
                className="px-4 py-2 text-xs md:text-sm font-semibold rounded bg-[#00FFA3] text-black hover:bg-[#00e5ff] transition shadow-md shadow-[#00FFA3]/10"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= GIAO DIỆN QUẢN TRỊ VIÊN (CHỈ ADMIN MỚI THẤY) ================= */}
      {viewMode === 'admin' ? (
        !isAdmin ? (
          <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-[#151922] border border-red-500/30 text-center">
            <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Khu Vực Bị Giới Hạn</h3>
            <p className="text-xs text-gray-400 mb-6">
              Bạn không có quyền quản trị viên để xem trang này.
            </p>
            <button
              onClick={() => setViewMode('shop')}
              className="px-6 py-2.5 rounded-lg bg-[#00FFA3] text-black font-bold text-xs"
            >
              Quay lại cửa hàng
            </button>
          </div>
        ) : (
          <main className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-gray-800 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-yellow-400/10 border border-yellow-400/30 text-xs text-yellow-400 mb-2 font-semibold">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Bảng Quản Trị Hệ Thống
                </div>
                <h2 className="text-2xl font-extrabold text-white">TriCyber Control Center</h2>
              </div>

              {/* 2 Tab: Quản lý Đơn hàng & Quản lý Kho sản phẩm */}
              <div className="flex bg-[#121620] p-1 rounded-xl border border-gray-800">
                <button
                  onClick={() => setAdminTab('orders')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                    adminTab === 'orders'
                      ? 'bg-[#00FFA3] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Quản Lý Đơn Hàng ({adminOrders.length})
                </button>
                <button
                  onClick={() => setAdminTab('products')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                    adminTab === 'products'
                      ? 'bg-[#00FFA3] text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" /> Quản Lý Sản Phẩm ({products.length})
                </button>
              </div>
            </div>

            {/* TAB 1: QUẢN LÝ ĐƠN HÀNG */}
            {adminTab === 'orders' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#151922] border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">Tổng Số Đơn Hàng</span>
                      <p className="text-2xl font-extrabold text-white mt-1">{adminOrders.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-[#151922] border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">Tổng Doanh Thu</span>
                      <p className="text-2xl font-extrabold text-[#00FFA3] mt-1">
                        {totalRevenue.toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#00FFA3]/10 text-[#00FFA3]">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-[#151922] border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">Đơn Chờ Xử Lý</span>
                      <p className="text-2xl font-extrabold text-yellow-400 mt-1">
                        {adminOrders.filter((o) => o.status === 'Đang xử lý').length}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-400/10 text-yellow-400">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#151922] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">Danh Sách Chi Tiết Đơn Hàng</h3>
                    <button
                      onClick={fetchAdminOrders}
                      className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs text-white border border-gray-700"
                    >
                      Làm mới
                    </button>
                  </div>

                  {adminLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
                      <Loader2 className="w-8 h-8 text-[#00FFA3] animate-spin" />
                      <span className="text-xs">Đang lấy dữ liệu đơn hàng...</span>
                    </div>
                  ) : adminError ? (
                    <div className="py-12 text-center text-red-400 text-xs">{adminError}</div>
                  ) : adminOrders.length === 0 ? (
                    <div className="py-20 text-center text-gray-500 text-xs">Chưa có đơn hàng nào.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#10141D] text-gray-400 uppercase tracking-wider text-[11px] border-b border-gray-800">
                          <tr>
                            <th className="py-3.5 px-4">Mã Đơn / Ngày</th>
                            <th className="py-3.5 px-4">Khách Hàng</th>
                            <th className="py-3.5 px-4">Sản Phẩm</th>
                            <th className="py-3.5 px-4">Tổng Tiền</th>
                            <th className="py-3.5 px-4">Trạng Thái</th>
                            <th className="py-3.5 px-4 text-center">Thao Tác Duyệt Đơn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                          {adminOrders.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-800/30 transition">
                              <td className="py-4 px-4 font-mono">
                                <span className="font-bold text-white block">#{order._id.slice(-6)}</span>
                                <span className="text-gray-500 text-[10px]">
                                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-semibold text-white">{order.customer?.fullName}</div>
                                <div className="text-gray-400 text-[11px]">{order.customer?.phone}</div>
                                <div className="text-gray-500 text-[10px] max-w-[200px] truncate">
                                  {order.customer?.address}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="space-y-1 max-w-[240px]">
                                  {order.orderItems?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <img src={item.image} alt="" className="w-6 h-6 rounded object-cover bg-black/40 shrink-0" />
                                      <span className="text-gray-300 text-[11px] truncate">
                                        {item.name} <span className="text-gray-500 font-semibold">x{item.quantity}</span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="py-4 px-4 font-bold text-[#00FFA3] text-sm">
                                {order.totalPrice?.toLocaleString('vi-VN')}₫
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                                  order.status === 'Hoàn thành'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                    : order.status === 'Đang giao'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    : order.status === 'Đã hủy'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                    : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                                }`}>
                                  {order.status || 'Đang xử lý'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-[#0B0E14] border border-gray-800 rounded-lg p-1">
                                  {['Đang xử lý', 'Đang giao', 'Hoàn thành', 'Đã hủy'].map((st) => (
                                    <button
                                      key={st}
                                      disabled={updatingOrderId === order._id || order.status === st}
                                      onClick={() => handleUpdateOrderStatus(order._id, st)}
                                      className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                                        order.status === st
                                          ? 'bg-[#00FFA3] text-black font-bold'
                                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 2: QUẢN LÝ SẢN PHẨM (THÊM / XÓA SẢN PHẨM) */}
            {adminTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form thêm sản phẩm mới */}
                <div className="bg-[#151922] border border-gray-800 rounded-2xl p-6 h-fit shadow-xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
                    <PlusCircle className="w-5 h-5 text-[#00FFA3]" /> Thêm Sản Phẩm Mới
                  </h3>

                  {productMessage && (
                    <div className="p-3 mb-4 rounded-lg bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] text-xs">
                      {productMessage}
                    </div>
                  )}

                  <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1">Tên sản phẩm *</label>
                      <input
                        type="text"
                        required
                        placeholder="Chuột Không Dây TriCyber X1..."
                        value={newProductForm.name}
                        onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-400 mb-1">Danh mục *</label>
                        <select
                          value={newProductForm.category}
                          onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                          className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3]"
                        >
                          <option value="gaming">Gaming Gear</option>
                          <option value="office">Đồ Văn Phòng</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1">Hãng (Brand) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Razer, Logitech..."
                          value={newProductForm.brand}
                          onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                          className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-400 mb-1">Giá bán (₫) *</label>
                        <input
                          type="number"
                          required
                          placeholder="1500000"
                          value={newProductForm.price}
                          onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                          className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3]"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1">Giá gốc (₫)</label>
                        <input
                          type="number"
                          placeholder="1900000"
                          value={newProductForm.originalPrice}
                          onChange={(e) => setNewProductForm({ ...newProductForm, originalPrice: e.target.value })}
                          className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Đường dẫn ảnh (URL)</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={newProductForm.image}
                        onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1">Chuẩn kết nối</label>
                      <input
                        type="text"
                        placeholder="Wireless 2.4GHz / Bluetooth 5.3"
                        value={newProductForm.specConnection}
                        onChange={(e) => setNewProductForm({ ...newProductForm, specConnection: e.target.value })}
                        className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={productActionLoading}
                      className="w-full py-3 rounded-lg bg-[#00FFA3] text-black font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#00e5ff] transition disabled:opacity-50 mt-4"
                    >
                      {productActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu Sản Phẩm Vào Kho'}
                    </button>
                  </form>
                </div>

                {/* Bảng danh sách sản phẩm hiện có & Xóa */}
                <div className="lg:col-span-2 bg-[#151922] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">Kho Sản Phẩm Hiện Tại ({products.length} món)</h3>
                    <span className="text-xs text-gray-400">Nhấn Xóa để gỡ khỏi database</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[600px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#10141D] text-gray-400 uppercase tracking-wider text-[11px] border-b border-gray-800 sticky top-0">
                        <tr>
                          <th className="py-3 px-4">Sản Phẩm</th>
                          <th className="py-3 px-4">Danh Mục / Hãng</th>
                          <th className="py-3 px-4">Giá Bán</th>
                          <th className="py-3 px-4 text-center">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-800/30 transition">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img src={p.image} alt="" className="w-10 h-10 rounded object-cover bg-black/40 shrink-0" />
                              <span className="font-semibold text-white max-w-[200px] truncate" title={p.name}>
                                {p.name}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[#00FFA3] block font-semibold uppercase text-[10px]">{p.brand}</span>
                              <span className="text-gray-400 text-[11px]">{p.category === 'gaming' ? 'Gaming Gear' : 'Đồ Văn Phòng'}</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              {p.price.toLocaleString('vi-VN')}₫
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition"
                                title="Xóa sản phẩm này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        )
      ) : (
        /* ================= GIAO DIỆN CỬA HÀNG KHÁCH HÀNG (SHOPPING) ================= */
        <>
          <section className="max-w-7xl mx-auto px-6 py-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-800 bg-gray-900/60 text-xs text-[#00FFA3] mb-4">
              <Zap className="w-3.5 h-3.5" /> MongoDB Atlas Database Connected
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Nâng Tầm Setup Cùng <span className="text-[#00FFA3]">TriCyber</span>
            </h1>
            <p className="mt-3 text-gray-400 max-w-lg mx-auto text-sm">
              Thiết bị gaming gear chuyên nghiệp & giải pháp công thái học văn phòng cao cấp chính hãng.
            </p>
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-4 mb-8 gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#00FFA3]" />
                <h2 className="text-lg md:text-xl font-bold text-white">
                  Danh Mục Sản Phẩm
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    ({displayProducts.length} sản phẩm)
                  </span>
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Tất Cả' },
                  { id: 'gaming', label: 'Gaming Gear' },
                  { id: 'office', label: 'Đồ Văn Phòng' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                      selectedCategory === cat.id
                        ? 'bg-[#00FFA3] text-black shadow-lg shadow-[#00FFA3]/20'
                        : 'bg-[#151922] text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 text-[#00FFA3] animate-spin" />
                <p className="text-sm">Đang tải dữ liệu từ cơ sở dữ liệu đám mây TriCyber...</p>
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="py-20 text-center text-gray-500">
                Không tìm thấy sản phẩm nào phù hợp với từ khóa của bạn.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-[#151922] border border-gray-800 rounded-xl overflow-hidden hover:border-[#00FFA3]/50 transition flex flex-col group shadow-lg"
                  >
                    <div 
                      className="relative aspect-video overflow-hidden bg-black/40 cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/151922/00FFA3?text=TriCyber+Gear';
                        }}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/80 border border-gray-700 text-[#00FFA3]">
                        {product.brand}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 
                          onClick={() => setSelectedProduct(product)}
                          className="font-semibold text-white text-sm line-clamp-2 hover:text-[#00FFA3] cursor-pointer transition"
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-yellow-400 text-xs">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{product.rating}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 line-through">
                            {product.originalPrice.toLocaleString('vi-VN')}₫
                          </div>
                          <div className="text-base font-bold text-[#00FFA3]">
                            {product.price.toLocaleString('vi-VN')}₫
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="p-2.5 rounded-lg bg-gray-800 hover:bg-[#00FFA3] hover:text-black transition"
                          title="Thêm vào giỏ"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ================= MODAL PROFILE & LỊCH SỬ MUA HÀNG ================= */}
      {isProfileOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#151922] border border-gray-800 rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-800/80 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3] flex items-center justify-center text-[#00FFA3]">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{currentUser.fullName}</h3>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-yellow-400/20 text-yellow-400 border border-yellow-400/40">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex border-b border-gray-800 mb-6 gap-2">
              <button
                type="button"
                onClick={() => setProfileTab('info')}
                className={`pb-3 text-xs md:text-sm font-bold transition flex items-center gap-2 ${
                  profileTab === 'info'
                    ? 'text-[#00FFA3] border-b-2 border-[#00FFA3]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Thông Tin Cá Nhân
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileTab('orders');
                  fetchUserOrders();
                }}
                className={`pb-3 text-xs md:text-sm font-bold transition flex items-center gap-2 ${
                  profileTab === 'orders'
                    ? 'text-[#00FFA3] border-b-2 border-[#00FFA3]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Package className="w-4 h-4" /> Lịch Sử Mua Hàng ({userOrders.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {profileTab === 'info' ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  {profileMessage.text && (
                    <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      profileMessage.type === 'success' 
                        ? 'bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3]' 
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                      {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{profileMessage.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-400 mb-1">Địa chỉ Email (Cố định)</label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full bg-[#0B0E14]/60 border border-gray-800 rounded-lg p-2.5 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-800">
                    <span className="text-xs font-semibold text-gray-300 block mb-2">Đổi Mật Khẩu (Để trống nếu không đổi):</span>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-400 mb-1">Mật khẩu hiện tại</label>
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu hiện tại"
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                          className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1">Mật khẩu mới</label>
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu mới muốn thay đổi"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                          className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full py-2.5 rounded-lg bg-[#00FFA3] text-black font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-[#00e5ff] transition disabled:opacity-50 mt-4 shadow-lg shadow-[#00FFA3]/10"
                  >
                    {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu Thay Đổi Thông Tin'}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  {ordersLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="w-6 h-6 text-[#00FFA3] animate-spin" />
                      <span className="text-xs">Đang tải lịch sử đơn hàng...</span>
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-xs">
                      Bạn chưa có đơn đặt hàng nào trong hệ thống.
                    </div>
                  ) : (
                    userOrders.map((order) => (
                      <div key={order._id} className="p-4 rounded-xl bg-[#181D28] border border-gray-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-2 text-xs">
                          <div>
                            <span className="text-gray-400">Mã đơn: </span>
                            <span className="font-mono text-white font-semibold">#{order._id.slice(-6)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/30">
                              {order.status || 'Đang xử lý'}
                            </span>
                            <span className="text-gray-500 text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {order.orderItems?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <img src={item.image} alt="" className="w-8 h-8 rounded object-cover bg-black/40" />
                                <span className="text-gray-300 line-clamp-1">{item.name} <span className="text-gray-500">x{item.quantity}</span></span>
                              </div>
                              <span className="font-semibold text-white whitespace-nowrap">
                                {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gray-800/80 pt-2 flex justify-between items-center text-xs">
                          <span className="text-gray-400">Địa chỉ: <span className="text-gray-300">{order.customer?.address}</span></span>
                          <span className="text-sm font-extrabold text-[#00FFA3]">
                            {order.totalPrice?.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL AUTH ================= */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#151922] border border-gray-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button 
              onClick={() => {
                setIsAuthOpen(false);
                setAuthError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-800/80 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex border-b border-gray-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`flex-1 pb-3 text-sm font-bold transition text-center ${
                  authMode === 'login'
                    ? 'text-[#00FFA3] border-b-2 border-[#00FFA3]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`flex-1 pb-3 text-sm font-bold transition text-center ${
                  authMode === 'register'
                    ? 'text-[#00FFA3] border-b-2 border-[#00FFA3]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Đăng Ký
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-gray-400 mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={authFormData.fullName}
                      onChange={(e) => setAuthFormData({ ...authFormData, fullName: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={authFormData.phone}
                      onChange={(e) => setAuthFormData({ ...authFormData, phone: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-gray-400 mb-1">Địa chỉ Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authFormData.email}
                  onChange={(e) => {
                    setAuthFormData({ ...authFormData, email: e.target.value });
                    if (authError) setAuthError('');
                  }}
                  className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authFormData.password}
                  onChange={(e) => {
                    setAuthFormData({ ...authFormData, password: e.target.value });
                    if (authError) setAuthError('');
                  }}
                  className={`w-full bg-[#0B0E14] border rounded-lg p-2.5 text-white focus:outline-none transition ${
                    authError ? 'border-red-500' : 'border-gray-800 focus:border-[#00FFA3]'
                  }`}
                />
                
                {authError && (
                  <div className="flex items-center gap-1.5 text-red-400 text-[11px] mt-2 animate-shake">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-lg bg-[#00FFA3] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#00e5ff] transition disabled:opacity-50 mt-4 shadow-lg shadow-[#00FFA3]/10"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'
                )}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-400">
              {authMode === 'login' ? (
                <span>
                  Chưa có tài khoản?{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError('');
                    }}
                    className="text-[#00FFA3] font-semibold hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </span>
              ) : (
                <span>
                  Đã có tài khoản?{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    className="text-[#00FFA3] font-semibold hover:underline"
                  >
                    Đăng nhập ngay
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= CART DRAWER ================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121620] h-full flex flex-col border-l border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#00FFA3]" />
                <h3 className="font-bold text-white text-lg">Giỏ Hàng Của Bạn</h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-sm">
                  Chưa có sản phẩm nào trong giỏ hàng.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 rounded-lg bg-[#181D28] border border-gray-800">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded bg-black/40"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-semibold text-white line-clamp-1">{item.name}</h4>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs font-bold text-[#00FFA3]">
                        {item.price.toLocaleString('vi-VN')}₫
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-gray-800 pt-4 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tổng thanh toán:</span>
                  <span className="text-lg font-extrabold text-[#00FFA3]">
                    {totalCartPrice.toLocaleString('vi-VN')}₫
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 rounded-lg bg-[#00FFA3] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#00e5ff] transition"
                >
                  Tiến hành thanh toán <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL CHECKOUT ================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151922] border border-gray-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <button 
              onClick={() => {
                setIsCheckoutOpen(false);
                setOrderSuccess(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-800/80 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {orderSuccess ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-[#00FFA3] mx-auto animate-bounce" />
                <h3 className="text-xl font-bold text-white">Đặt Hàng Thành Công!</h3>
                <p className="text-sm text-gray-400 max-w-xs mx-auto">
                  Đơn hàng của bạn đã được ghi nhận trên cơ sở dữ liệu MongoDB Atlas.
                </p>
                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setOrderSuccess(false);
                  }}
                  className="mt-4 px-6 py-2.5 rounded-lg bg-[#00FFA3] text-black font-bold text-sm hover:bg-[#00e5ff] transition"
                >
                  Tiếp tục mua hàng
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-3 mb-4">
                  Thông Tin Giao Hàng & Đặt Hàng
                </h3>
                <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">Họ và tên người nhận *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={customerInfo.fullName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Số điện thoại liên hệ *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0987654321"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Địa chỉ giao hàng chi tiết *</label>
                    <textarea
                      rows="2"
                      required
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Ghi chú thêm (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="Giao giờ hành chính, gọi trước khi đến..."
                      value={customerInfo.note}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                      className="w-full bg-[#0B0E14] border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00FFA3] transition"
                    />
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center text-sm">
                    <span className="text-gray-400">Tổng tiền thanh toán:</span>
                    <span className="text-base font-extrabold text-[#00FFA3]">
                      {totalCartPrice.toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg bg-[#00FFA3] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#00e5ff] transition disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi đơn hàng...
                      </>
                    ) : (
                      'Xác Nhận Đặt Hàng'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL PRODUCT DETAIL ================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#151922] border border-gray-800 rounded-2xl max-w-2xl w-full p-6 relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-800/80 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="aspect-square rounded-xl overflow-hidden bg-black/40 border border-gray-800">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#00FFA3] tracking-wider">
                    {selectedProduct.brand} • {selectedProduct.category === 'gaming' ? 'Gaming Gear' : 'Thiết bị Văn phòng'}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-1 text-yellow-400 text-xs mt-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{selectedProduct.rating} (Đánh giá chuyên sâu)</span>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-[#0B0E14] border border-gray-800 space-y-1.5 text-xs">
                    <span className="font-bold text-gray-300 block mb-2">Thông số kỹ thuật:</span>
                    {Object.entries(selectedProduct.specs || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-gray-400 capitalize">
                        <span>{key}:</span>
                        <span className="text-white font-medium">{val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#00FFA3]">
                      {selectedProduct.price.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="text-xs text-gray-500 line-through">
                      {selectedProduct.originalPrice.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                      setIsCartOpen(true);
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#00FFA3] text-black font-bold text-sm hover:bg-[#00e5ff] transition"
                  >
                    Thêm vào giỏ & Xem giỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;