import { apiFetch, assetUrl } from "../config";
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BarChart3,
  Boxes,
  Edit3,
  Image,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Plus,
  Save,
  ShieldCheck,
  TicketPercent,
  Trash2,
  Truck,
  Upload,
  X,
  Users,
  Bell,
  AlertTriangle,
  PackageSearch,
} from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../store/useStore';
import { usePageMeta } from '../lib/usePageMeta';

type AdminProduct = Product & {
  stock?: number;
  images?: string[];
  variants?: string[];
};

type OrderRecord = {
  _id: string;
  amount: number;
  currency: string;
  paymentMode: string;
  paymentStatus?: string;
  razorpayPaymentId?: string;
  status: string;
  returnStatus?: string;
  shippingStatus?: string;
  trackingId?: string;
  invoiceId?: string;
  address?: { fullName?: string; city?: string; phone?: string };
  items?: { product?: Product; quantity?: number }[];
  createdAt: string;
};

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  blocked: boolean;
  createdAt: string;
  orders: number;
  spent: number;
};

type Coupon = {
  _id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  expiresAt: string;
  active: boolean;
  usageLimit: number;
  used: number;
};

type Banner = {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  placement: 'homepage' | 'promotional';
  active: boolean;
};

type AdminNotification = {
  _id: string;
  key: string;
  type: 'low_stock' | 'new_order' | 'pending_order' | 'shipping_reminder' | 'delivery_reminder' | 'return_requested' | 'bulk_upload' | 'product_update';
  severity: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message: string;
  entityId?: string;
  entityType?: 'order' | 'product' | 'user' | 'bulk';
  link?: string;
  readAt?: string;
  createdAt: string;
};

type Dashboard = {
  metrics: {
    revenue: number;
    orders: number;
    users: number;
    products: number;
    traffic: number;
    inventoryValue?: number;
    inventoryCost?: number;
    estimatedProfit?: number;
    lowStock?: number;
  };
  notificationSummary?: { total: number; unread: number };
  revenueSeries: { label: string; value: number }[];
  userGrowth: { label: string; value: number }[];
  bestSellers: { name: string; qty: number; revenue: number }[];
  trafficSources: { label: string; value: number }[];
};

const productFormDefault = {
  code: '',
  sku: '',
  name: '',
  price: '',
  originalPrice: '',
  costPrice: '',
  category: 'Streetwear',
  image: '',
  images: '',
  sizes: 'S,M,L,XL',
  colors: 'Black,White',
  stock: '25',
  lowStockThreshold: '5',
  variants: 'Regular Fit, Oversized',
  keywords: '',
  seoTitle: '',
  seoDescription: '',
  description: '',
  isTrending: true,
};

const bulkUploadDefault = `[
  {
    "name": "Oversized Hoodie",
    "price": 1499,
    "originalPrice": 2299,
    "category": "Hoodies",
    "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
    "description": "Heavy cotton hoodie",
    "stock": 20,
    "costPrice": 850,
    "lowStockThreshold": 5,
    "keywords": ["oversized","winter wear","cotton hoodie"],
    "seoTitle": "Oversized Hoodie for Men and Women | Trendora",
    "seoDescription": "Shop heavy cotton oversized hoodies with premium comfort and streetwear styling.",
    "sizes": ["S","M","L","XL"],
    "colors": ["Black","Grey"]
  }
]`;

const couponFormDefault = {
  code: '',
  discountType: 'percent' as 'percent' | 'flat',
  discountValue: '10',
  expiresAt: '',
  usageLimit: '100',
  active: true,
};

const bannerFormDefault = {
  title: '',
  subtitle: '',
  image: '',
  link: '/',
  placement: 'homepage' as 'homepage' | 'promotional',
  active: true,
};

const tabs = [
  { id: 'analytics', label: 'Analytics', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: PackageCheck },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'coupons', label: 'Coupons', icon: TicketPercent },
  { id: 'banners', label: 'Banners', icon: Image },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('trendora-admin-token') || '');
  const [login, setLogin] = useState({ email: 'admin@trendora.local', password: '' });
  const [activeTab, setActiveTab] = useState<TabId>('analytics');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [productForm, setProductForm] = useState(productFormDefault);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState(couponFormDefault);
  const [bannerForm, setBannerForm] = useState(bannerFormDefault);
  const [bulkUploadText, setBulkUploadText] = useState(bulkUploadDefault);
  const [bulkUploadFormat, setBulkUploadFormat] = useState<'json' | 'csv'>('json');
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropImage, setCropImage] = useState<{ src: string; name: string; type: string; width: number; height: number } | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 50, y: 50 });
  const clearAuthSession = useStore((state) => state.clearAuthSession);

  usePageMeta({
    title: 'Admin Dashboard | Trendora',
    description: 'Manage products, orders, coupons, banners, and customer accounts for Trendora.',
  });

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const lowStockProducts = products.filter((product) => Number(product.stock ?? 0) <= Number(product.lowStockThreshold ?? 5));
  const unreadNotificationCount = notifications.filter((item) => !item.readAt).length;
  const urgentNotificationCount = notifications.filter((item) => !item.readAt && (item.severity === 'warning' || item.severity === 'danger')).length;

  const adminFetch = useCallback(async <T,>(path: string, options: RequestInit = {}) => {
    return apiFetch<T>(path, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers || {}),
      },
    });
  }, [authHeaders]);

  const loadAdminData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const [dashboardData, productData, orderData, userData, couponData, bannerData, notificationData] = await Promise.all([
        adminFetch<Dashboard>('/api/admin/dashboard'),
        adminFetch<AdminProduct[]>('/api/products'),
        adminFetch<OrderRecord[]>('/api/admin/orders'),
        adminFetch<AdminUser[]>('/api/admin/users'),
        adminFetch<Coupon[]>('/api/admin/coupons'),
        adminFetch<Banner[]>('/api/admin/banners'),
        adminFetch<{ notifications: AdminNotification[] }>('/api/admin/notifications'),
      ]);
      setDashboard(dashboardData);
      setProducts(productData);
      setOrders(orderData);
      setUsers(userData);
      setCoupons(couponData);
      setBanners(bannerData);
      setNotifications(notificationData.notifications);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Admin data load nahi ho paya.');
      localStorage.removeItem('trendora-admin-token');
      setToken('');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [adminFetch, token]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = await apiFetch<{ token: string }>('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login),
      });
      localStorage.setItem('trendora-admin-token', data.token);
      setToken(data.token);
      setMessage('Admin login successful. Session 8 hours ke liye active hai.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login nahi ho paya.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthSession();
    localStorage.removeItem('trendora-admin-token');
    setToken('');
    setNotifications([]);
    setMessage('');
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productForm.image) {
      setMessage('Pehle product image choose karo.');
      return;
    }
    const method = editingProductId ? 'PUT' : 'POST';
    const path = editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
    const saved = await adminFetch<AdminProduct>(path, {
      method,
      body: JSON.stringify(productForm),
    });
    setMessage(`${saved.name} ${editingProductId ? 'update' : 'add'} ho gaya.`);
    setProductForm(productFormDefault);
    setEditingProductId(null);
    loadAdminData();
  };

  const openCropper = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage('Sirf image file upload kar sakte ho.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const image = new window.Image();
      image.onload = () => {
        setCropImage({ src, name: file.name, type: file.type, width: image.naturalWidth, height: image.naturalHeight });
        setCropZoom(1);
        setCropOffset({ x: 50, y: 50 });
      };
      image.src = src;
    };
    reader.readAsDataURL(file);
  };

  const createCroppedImage = async () => {
    if (!cropImage) return;

    const source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = cropImage.src;
    });

    const outputWidth = 1200;
    const outputHeight = 1500;
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image crop nahi ho paya.');

    const coverScale = Math.max(outputWidth / source.naturalWidth, outputHeight / source.naturalHeight) * cropZoom;
    const drawWidth = source.naturalWidth * coverScale;
    const drawHeight = source.naturalHeight * coverScale;
    const maxX = Math.max(drawWidth - outputWidth, 0);
    const maxY = Math.max(drawHeight - outputHeight, 0);
    const drawX = -maxX * (cropOffset.x / 100);
    const drawY = -maxY * (cropOffset.y / 100);

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(source, drawX, drawY, drawWidth, drawHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('Image crop nahi ho paya.'));
      }, 'image/jpeg', 0.9);
    });

    const fileName = cropImage.name.replace(/\.[^.]+$/, '') || 'product';
    return new File([blob], `${fileName}-cropped.jpg`, { type: 'image/jpeg' });
  };

  const uploadImage = async (file: File) => {

    setUploadingImage(true);
    setMessage('');
    try {
      const data = await apiFetch<{ url: string }>('/api/admin/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': file.type,
          'x-file-name': file.name,
        },
        body: file,
      });

      setProductForm((current) => ({
        ...current,
        image: data.url,
        images: current.images ? `${current.images}, ${data.url}` : data.url,
      }));
      setMessage('Image upload ho gayi. Ab product save kar sakte ho.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Image upload nahi ho payi.');
    } finally {
      setUploadingImage(false);
    }
  };

  const cropAndUploadImage = async () => {
    try {
      const croppedFile = await createCroppedImage();
      if (!croppedFile) return;
      setCropImage(null);
      await uploadImage(croppedFile);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Image crop nahi ho paya.');
    }
  };

  const editProduct = (product: AdminProduct) => {
    setEditingProductId(product._id);
    setProductForm({
      code: product.code || '',
      sku: product.sku || product.code || '',
      name: product.name,
      price: String(product.price),
      originalPrice: String(product.originalPrice),
      costPrice: String(product.costPrice || ''),
      category: product.category,
      image: product.image,
      images: (product.images || [product.image]).join(', '),
      sizes: product.sizes.join(', '),
      colors: product.colors.join(', '),
      stock: String(product.stock || 0),
      lowStockThreshold: String(product.lowStockThreshold ?? 5),
      variants: (product.variants || []).join(', '),
      keywords: (product.keywords || []).join(', '),
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      description: product.description,
      isTrending: product.isTrending,
    });
    setActiveTab('products');
  };

  const deleteProduct = async (id: string) => {
    await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    setMessage('Product delete ho gaya.');
    loadAdminData();
  };

  const updateOrder = async (order: OrderRecord, patch: Partial<OrderRecord>) => {
    await adminFetch(`/api/admin/orders/${order._id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...order, ...patch }),
    });
    loadAdminData();
  };

  const toggleUserBlock = async (user: AdminUser) => {
    await adminFetch(`/api/admin/users/${user._id}`, {
      method: 'PUT',
      body: JSON.stringify({ blocked: !user.blocked }),
    });
    loadAdminData();
  };

  const saveCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await adminFetch('/api/admin/coupons', { method: 'POST', body: JSON.stringify(couponForm) });
    setCouponForm(couponFormDefault);
    setMessage('Coupon create ho gaya.');
    loadAdminData();
  };

  const toggleCoupon = async (coupon: Coupon) => {
    await adminFetch(`/api/admin/coupons/${coupon._id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !coupon.active }),
    });
    loadAdminData();
  };

  const deleteCoupon = async (id: string) => {
    await adminFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    loadAdminData();
  };

  const saveBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await adminFetch('/api/admin/banners', { method: 'POST', body: JSON.stringify(bannerForm) });
    setBannerForm(bannerFormDefault);
    setMessage('Banner create ho gaya.');
    loadAdminData();
  };

  const toggleBanner = async (banner: Banner) => {
    await adminFetch(`/api/admin/banners/${banner._id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !banner.active }),
    });
    loadAdminData();
  };

  const deleteBanner = async (id: string) => {
    await adminFetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
    loadAdminData();
  };

  const handleBulkFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setBulkUploadText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const markNotificationsRead = async (ids?: string[], all = false) => {
    await adminFetch('/api/admin/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ ids, all }),
    });
    loadAdminData();
  };

  const uploadBulkProducts = async () => {
    setBulkUploadLoading(true);
    setMessage('');
    try {
      const response = await adminFetch<{ success: boolean; createdCount: number; skipped: Array<{ index: number; reason: string }> }>('/api/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ format: bulkUploadFormat, content: bulkUploadText }),
      });
      setMessage(`${response.createdCount} products uploaded. ${response.skipped.length ? `${response.skipped.length} skipped.` : ''}`.trim());
      loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Bulk upload failed.');
    } finally {
      setBulkUploadLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#55205f] via-fuchsia-800 to-pink-600 px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-pink-600">
              <ShieldCheck size={24} />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-100">Secure Admin</p>
            <h1 className="mt-3 text-3xl font-black">Trendora Admin Login</h1>
            <p className="mt-2 text-sm text-white/60">Admin panel open karne ke liye email aur password required hai.</p>
          </div>

          <form onSubmit={handleLogin} className="rounded-2xl border border-white/10 bg-white p-4 text-black shadow-2xl">
            <label className="text-sm font-bold">
              Admin Email
              <input value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-gray-200 px-3 font-normal outline-none" />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Password
              <input required type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-gray-200 px-3 font-normal outline-none" />
            </label>
            <button disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-700 to-pink-500 font-black text-white disabled:opacity-60">
              <ShieldCheck size={18} /> {loading ? 'Checking...' : 'LOGIN SECURELY'}
            </button>
            {message && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{message}</p>}
            <p className="mt-4 text-xs text-gray-500">Local default: email admin@trendora.local, password trendora-admin. Production me .env.local me ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET set karo.</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 text-[#55205f]">
      <header className="sticky top-0 z-30 border-b border-pink-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-pink-500">
              <ShieldCheck size={16} /> Authenticated Admin
            </div>
            <h1 className="text-xl font-black text-[#55205f]">Trendora Control Center</h1>
            <p className="mt-1 text-xs font-semibold text-gray-500">{unreadNotificationCount} unread notifications · {urgentNotificationCount} urgent</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => markNotificationsRead(undefined, true)} className="flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-[#55205f]">
              <Bell size={16} /> Mark all read
            </button>
            <button onClick={logout} className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-700 to-pink-500 px-4 text-sm font-bold text-white">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-max rounded-2xl border border-pink-100 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex h-11 items-center gap-2 rounded-xl px-3 text-left text-sm font-bold ${activeTab === tab.id ? 'bg-gradient-to-r from-fuchsia-700 to-pink-500 text-white' : 'text-[#55205f] hover:bg-pink-50'}`}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          {lowStockProducts.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
              <p className="font-black">Low stock alert</p>
              <p className="mt-1">{lowStockProducts.length} product(s) reached their reorder point.</p>
            </div>
          )}
          {message && <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-700 shadow-sm">{message}</div>}
          {loading && <div className="mb-4 rounded-2xl bg-black p-3 text-sm font-bold text-white">Loading admin data...</div>}

          {activeTab === 'analytics' && (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ['Revenue', `₹${Math.round(dashboard?.metrics.revenue || 0)}`],
                  ['Orders', dashboard?.metrics.orders || 0],
                  ['Users', dashboard?.metrics.users || 0],
                  ['Products', dashboard?.metrics.products || 0],
                  ['Est. Profit', `₹${Math.round(dashboard?.metrics.estimatedProfit || 0)}`],
                  ['Inventory', `₹${Math.round(dashboard?.metrics.inventoryValue || 0)}`],
                  ['Low Stock', dashboard?.metrics.lowStock ?? lowStockProducts.length],
                  ['Traffic', dashboard?.metrics.traffic || 0],
                  ['Alerts', dashboard?.notificationSummary?.unread ?? unreadNotificationCount],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-black">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <AdminPanel title="Revenue Chart" icon={BarChart3}>
                  <SimpleBars data={dashboard?.revenueSeries || []} />
                </AdminPanel>
                <AdminPanel title="Best Selling Products" icon={PackageCheck}>
                  <div className="space-y-3">
                    {(dashboard?.bestSellers || []).map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 text-sm">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-gray-500">{item.qty} sold · ₹{item.revenue}</span>
                      </div>
                    ))}
                    {!dashboard?.bestSellers?.length && <EmptyState text="Orders aate hi best sellers yahan dikhenge." />}
                  </div>
                </AdminPanel>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="grid gap-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_1fr]">
                <AdminPanel title={editingProductId ? 'Edit Product' : 'Add Product'} icon={Plus}>
                  <form onSubmit={saveProduct} className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <AdminInput label="Product Code" value={productForm.code} onChange={(value) => setProductForm({ ...productForm, code: value })} placeholder="Auto generate ke liye blank chhodo" />
                      <AdminInput label="SKU" value={productForm.sku} onChange={(value) => setProductForm({ ...productForm, sku: value })} placeholder="Internal stock code" />
                    </div>
                    <AdminInput label="Product Name" value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} required />
                    <div className="grid grid-cols-2 gap-3">
                      <AdminInput label="Price" type="number" value={productForm.price} onChange={(value) => setProductForm({ ...productForm, price: value })} required />
                      <AdminInput label="MRP" type="number" value={productForm.originalPrice} onChange={(value) => setProductForm({ ...productForm, originalPrice: value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <AdminInput label="Cost Price" type="number" value={productForm.costPrice} onChange={(value) => setProductForm({ ...productForm, costPrice: value })} placeholder="Profit tracking ke liye" />
                      <AdminInput label="Reorder Point" type="number" value={productForm.lowStockThreshold} onChange={(value) => setProductForm({ ...productForm, lowStockThreshold: value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <AdminInput label="Category" value={productForm.category} onChange={(value) => setProductForm({ ...productForm, category: value })} required />
                      <AdminInput label="Stock" type="number" value={productForm.stock} onChange={(value) => setProductForm({ ...productForm, stock: value })} />
                    </div>
                    <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50/60 p-3">
                      <p className="text-sm font-black text-gray-900">Main Product Image</p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">Phone gallery ya folder se image choose karo. URL likhne ki zaroorat nahi.</p>
                      <label className="mt-3 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-500 px-4 text-sm font-black text-white shadow-sm">
                        <Upload size={18} /> {uploadingImage ? 'Uploading...' : 'Choose Image'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) openCropper(file);
                            event.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                      {productForm.image && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-white bg-white">
                          <img src={assetUrl(productForm.image)} alt="Product preview" className="h-44 w-full object-cover" />
                        </div>
                      )}
                    </div>
                    <AdminInput label="More Images" value={productForm.images} onChange={(value) => setProductForm({ ...productForm, images: value })} placeholder="Upload ke baad images yahan auto add hongi" />
                    <div className="grid grid-cols-2 gap-3">
                      <AdminInput label="Sizes" value={productForm.sizes} onChange={(value) => setProductForm({ ...productForm, sizes: value })} />
                      <AdminInput label="Colors" value={productForm.colors} onChange={(value) => setProductForm({ ...productForm, colors: value })} />
                    </div>
                    <AdminInput label="Variants" value={productForm.variants} onChange={(value) => setProductForm({ ...productForm, variants: value })} />
                    <AdminInput label="Search Keywords" value={productForm.keywords} onChange={(value) => setProductForm({ ...productForm, keywords: value })} placeholder="Comma se separate karo: black shirt, party wear, cotton" />
                    <AdminInput label="SEO Title" value={productForm.seoTitle} onChange={(value) => setProductForm({ ...productForm, seoTitle: value })} placeholder="Google title ke liye optional" />
                    <label className="text-sm font-bold">
                      SEO Description
                      <textarea value={productForm.seoDescription} onChange={(event) => setProductForm({ ...productForm, seoDescription: event.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-gray-200 p-3 font-normal outline-none" />
                    </label>
                    <label className="text-sm font-bold">
                      Description
                      <textarea required value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} className="mt-2 min-h-24 w-full rounded-xl border border-gray-200 p-3 font-normal outline-none" />
                    </label>
                    <label className="flex items-center gap-3 text-sm font-bold">
                      <input type="checkbox" checked={productForm.isTrending} onChange={(event) => setProductForm({ ...productForm, isTrending: event.target.checked })} />
                      Show in trending
                    </label>
                    <button className="flex h-12 items-center justify-center gap-2 rounded-full bg-black font-black text-white">
                      <Save size={18} /> {editingProductId ? 'Update Product' : 'Add Product'}
                    </button>
                  </form>
                </AdminPanel>

                <AdminPanel title="Product Management" icon={Boxes}>
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product._id} className="grid gap-3 rounded-2xl border border-gray-100 p-3 sm:grid-cols-[64px_1fr_auto]">
                        <img src={assetUrl(product.image)} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-black">{product.name}</p>
                          <p className="text-xs font-black text-pink-600">Code: {product.code} · SKU: {product.sku || product.code}</p>
                          <p className="text-sm text-gray-500">₹{product.price} · Cost ₹{product.costPrice || 0} · {product.category}</p>
                          <p className="text-xs text-gray-500">Stock {product.stock ?? 0} · Reorder at {product.lowStockThreshold ?? 5} · Margin ₹{Math.max(0, Number(product.price || 0) - Number(product.costPrice || 0))}</p>
                          <p className="text-xs text-gray-400">Sizes {product.sizes.join(', ')} · Colors {product.colors.join(', ')}</p>
                          {(product.keywords || []).length > 0 && (
                            <p className="text-xs text-gray-400">Keywords {(product.keywords || []).join(', ')}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <IconButton label="Edit product" onClick={() => editProduct(product)}><Edit3 size={17} /></IconButton>
                          <IconButton label="Delete product" onClick={() => deleteProduct(product._id)} danger><Trash2 size={17} /></IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </AdminPanel>
              </div>

              <AdminPanel title="Bulk Product Upload" icon={PackageSearch}>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="grid gap-3">
                    <textarea
                      value={bulkUploadText}
                      onChange={(event) => setBulkUploadText(event.target.value)}
                      className="min-h-72 w-full rounded-2xl border border-gray-200 p-3 text-sm outline-none focus:border-black"
                      placeholder="Paste JSON array or CSV text here"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => setBulkUploadText(bulkUploadDefault)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700">
                        Load sample
                      </button>
                      <label className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700">
                        <input
                          type="file"
                          accept=".json,.csv,text/csv,application/json"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) handleBulkFile(file);
                            event.target.value = '';
                          }}
                        />
                        Choose file
                      </label>
                      <div className="flex rounded-full border border-gray-200 bg-gray-50 p-1">
                        <button type="button" onClick={() => setBulkUploadFormat('json')} className={`rounded-full px-4 py-2 text-sm font-bold ${bulkUploadFormat === 'json' ? 'bg-black text-white' : 'text-gray-600'}`}>
                          JSON
                        </button>
                        <button type="button" onClick={() => setBulkUploadFormat('csv')} className={`rounded-full px-4 py-2 text-sm font-bold ${bulkUploadFormat === 'csv' ? 'bg-black text-white' : 'text-gray-600'}`}>
                          CSV
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm font-black text-gray-900">Bulk upload notes</p>
                    <p className="text-sm text-gray-600">Products JSON array ya CSV paste karo. Same dashboard me upload, stock, aur notifications update ho jayengi.</p>
                    <button
                      type="button"
                      onClick={uploadBulkProducts}
                      disabled={bulkUploadLoading}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black font-black text-white disabled:opacity-60"
                    >
                      <Upload size={18} /> {bulkUploadLoading ? 'Uploading...' : 'Upload products'}
                    </button>
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-3 text-xs text-gray-500">
                      JSON sample me array of product objects hota hai. CSV me headers: name,price,originalPrice,category,image,description,stock.
                    </div>
                  </div>
                </div>
              </AdminPanel>
            </div>
          )}

          {activeTab === 'orders' && (
            <AdminPanel title="Order, Shipping, Returns & Invoices" icon={Truck}>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order._id} className="rounded-2xl border border-gray-100 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{order._id}</p>
                        <p className="text-sm text-gray-500">₹{Math.round(order.amount / 100)} · {order.paymentMode} · {order.paymentStatus || order.status} · {order.address?.fullName || 'Customer'}</p>
                        {order.razorpayPaymentId && <p className="text-xs text-gray-400">Payment: {order.razorpayPaymentId}</p>}
                        <p className="text-xs text-gray-400">Invoice: {order.invoiceId || `INV-${order._id.toUpperCase()}`}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Select value={order.status} onChange={(value) => updateOrder(order, { status: value })} options={['created', 'placed', 'packed', 'shipped', 'delivered', 'cancelled']} />
                        <Select value={order.shippingStatus || 'pending'} onChange={(value) => updateOrder(order, { shippingStatus: value })} options={['pending', 'label_created', 'in_transit', 'delivered']} />
                        <Select value={order.returnStatus || 'none'} onChange={(value) => updateOrder(order, { returnStatus: value })} options={['none', 'requested', 'approved', 'rejected', 'completed']} />
                      </div>
                    </div>
                  </div>
                ))}
                {!orders.length && <EmptyState text="Abhi tak orders nahi aaye." />}
              </div>
            </AdminPanel>
          )}

          {activeTab === 'users' && (
            <AdminPanel title="User Management & Analytics" icon={Users}>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 p-3">
                    <div>
                      <p className="font-black">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email} · {user.role}</p>
                      <p className="text-xs text-gray-400">{user.orders} orders · ₹{Math.round(user.spent)} spent</p>
                    </div>
                    <button onClick={() => toggleUserBlock(user)} className={`rounded-full px-4 py-2 text-sm font-bold ${user.blocked ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {user.blocked ? 'Unblock User' : 'Block User'}
                    </button>
                  </div>
                ))}
              </div>
            </AdminPanel>
          )}

          {activeTab === 'coupons' && (
            <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
              <AdminPanel title="Create Coupon" icon={TicketPercent}>
                <form onSubmit={saveCoupon} className="grid gap-3">
                  <AdminInput label="Coupon Code" value={couponForm.code} onChange={(value) => setCouponForm({ ...couponForm, code: value })} required />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={couponForm.discountType} onChange={(value) => setCouponForm({ ...couponForm, discountType: value as 'percent' | 'flat' })} options={['percent', 'flat']} />
                    <AdminInput label="Discount" type="number" value={couponForm.discountValue} onChange={(value) => setCouponForm({ ...couponForm, discountValue: value })} required />
                  </div>
                  <AdminInput label="Expiry" type="date" value={couponForm.expiresAt} onChange={(value) => setCouponForm({ ...couponForm, expiresAt: value })} required />
                  <AdminInput label="Usage Limit" type="number" value={couponForm.usageLimit} onChange={(value) => setCouponForm({ ...couponForm, usageLimit: value })} />
                  <button className="h-12 rounded-full bg-black font-black text-white">Create Coupon</button>
                </form>
              </AdminPanel>
              <AdminPanel title="Discount Management" icon={TicketPercent}>
                <div className="space-y-3">
                  {coupons.map((coupon) => (
                    <div key={coupon._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 p-3">
                      <div>
                        <p className="font-black">{coupon.code}</p>
                        <p className="text-sm text-gray-500">{coupon.discountValue}{coupon.discountType === 'percent' ? '%' : ' INR'} off · expires {coupon.expiresAt}</p>
                        <p className="text-xs text-gray-400">{coupon.used}/{coupon.usageLimit} used</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleCoupon(coupon)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold">{coupon.active ? 'Disable' : 'Enable'}</button>
                        <IconButton label="Delete coupon" onClick={() => deleteCoupon(coupon._id)} danger><Trash2 size={17} /></IconButton>
                      </div>
                    </div>
                  ))}
                  {!coupons.length && <EmptyState text="Coupon create karo, yahan list dikhegi." />}
                </div>
              </AdminPanel>
            </div>
          )}

          {activeTab === 'banners' && (
            <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
              <AdminPanel title="Create Banner" icon={Image}>
                <form onSubmit={saveBanner} className="grid gap-3">
                  <AdminInput label="Title" value={bannerForm.title} onChange={(value) => setBannerForm({ ...bannerForm, title: value })} required />
                  <AdminInput label="Subtitle" value={bannerForm.subtitle} onChange={(value) => setBannerForm({ ...bannerForm, subtitle: value })} />
                  <AdminInput label="Image URL" value={bannerForm.image} onChange={(value) => setBannerForm({ ...bannerForm, image: value })} required />
                  <AdminInput label="Link" value={bannerForm.link} onChange={(value) => setBannerForm({ ...bannerForm, link: value })} />
                  <Select value={bannerForm.placement} onChange={(value) => setBannerForm({ ...bannerForm, placement: value as 'homepage' | 'promotional' })} options={['homepage', 'promotional']} />
                  <button className="h-12 rounded-full bg-black font-black text-white">Create Banner</button>
                </form>
              </AdminPanel>
              <AdminPanel title="Homepage & Promotional Banners" icon={Image}>
                <div className="space-y-3">
                  {banners.map((banner) => (
                    <div key={banner._id} className="grid gap-3 rounded-2xl border border-gray-100 p-3 sm:grid-cols-[96px_1fr_auto]">
                      <img src={assetUrl(banner.image)} alt={banner.title} className="h-20 w-24 rounded-xl object-cover" />
                      <div>
                        <p className="font-black">{banner.title}</p>
                        <p className="text-sm text-gray-500">{banner.subtitle || 'No subtitle'} · {banner.placement}</p>
                        <p className="text-xs text-gray-400">{banner.link}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleBanner(banner)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold">{banner.active ? 'Hide' : 'Show'}</button>
                        <IconButton label="Delete banner" onClick={() => deleteBanner(banner._id)} danger><Trash2 size={17} /></IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
              <AdminPanel title="Live Notification Center" icon={Bell}>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Summary</p>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total</p>
                        <p className="mt-1 text-xl font-black text-gray-900">{notifications.length}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Unread</p>
                        <p className="mt-1 text-xl font-black text-gray-900">{unreadNotificationCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                    Notifications low stock, pending orders, returns, shipping reminders aur bulk uploads se auto-generate hoti hain.
                  </div>
                </div>
              </AdminPanel>

              <AdminPanel title="Notification Feed" icon={AlertTriangle}>
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => markNotificationsRead([item._id])}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${item.readAt ? 'border-gray-100 bg-white' : 'border-pink-200 bg-pink-50/70'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-gray-900">{item.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{item.message}</p>
                          <p className="mt-2 text-[11px] uppercase tracking-wider text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${item.severity === 'danger' ? 'bg-red-100 text-red-700' : item.severity === 'warning' ? 'bg-amber-100 text-amber-700' : item.severity === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.type.replaceAll('_', ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                  {!notifications.length && <EmptyState text="Koi notification abhi nahi hai." />}
                </div>
              </AdminPanel>
            </div>
          )}
        </section>
      </main>

      {cropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 text-[#55205f] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Crop Product Image</h2>
                <p className="text-xs font-semibold text-gray-500">Image ko product card ratio me set karo.</p>
              </div>
              <button onClick={() => setCropImage(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100" aria-label="Close cropper">
                <X size={18} />
              </button>
            </div>

            <div className="mx-auto aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-2xl bg-gray-100 ring-4 ring-pink-100">
              <div
                className="h-full w-full bg-cover bg-no-repeat"
                style={{
                  backgroundImage: `url(${cropImage.src})`,
                  backgroundSize: cropImage.width / cropImage.height > 0.8 ? `auto ${cropZoom * 100}%` : `${cropZoom * 100}% auto`,
                  backgroundPosition: `${cropOffset.x}% ${cropOffset.y}%`,
                }}
              />
            </div>

            <div className="mt-5 grid gap-4">
              <label className="text-sm font-bold">
                Zoom
                <input type="range" min="1" max="2.5" step="0.05" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} className="mt-2 w-full accent-pink-600" />
              </label>
              <label className="text-sm font-bold">
                Move Left / Right
                <input type="range" min="0" max="100" value={cropOffset.x} onChange={(event) => setCropOffset((current) => ({ ...current, x: Number(event.target.value) }))} className="mt-2 w-full accent-pink-600" />
              </label>
              <label className="text-sm font-bold">
                Move Up / Down
                <input type="range" min="0" max="100" value={cropOffset.y} onChange={(event) => setCropOffset((current) => ({ ...current, y: Number(event.target.value) }))} className="mt-2 w-full accent-pink-600" />
              </label>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setCropImage(null)} className="h-12 rounded-full bg-gray-100 font-black text-gray-700">Cancel</button>
              <button onClick={cropAndUploadImage} className="h-12 rounded-full bg-gradient-to-r from-fuchsia-700 to-pink-500 font-black text-white">
                Crop & Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel({ title, icon: Icon, children }: { title: string; icon: typeof LayoutDashboard; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 font-black">
        <Icon size={18} /> {title}
      </div>
      {children}
    </section>
  );
}

function AdminInput({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 font-normal outline-none focus:border-black" />
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold outline-none">
      {options.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
    </select>
  );
}

function IconButton({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button title={label} aria-label={label} onClick={onClick} className={`flex h-10 w-10 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-800'}`}>
      {children}
    </button>
  );
}

function SimpleBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  if (!data.length) return <EmptyState text="Revenue chart orders ke baad populate hoga." />;
  return (
    <div className="flex h-56 items-end gap-3 rounded-2xl bg-gray-50 p-4">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t-xl bg-black" style={{ height: `${Math.max((item.value / max) * 180, 10)}px` }} />
          <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500">{text}</div>;
}
