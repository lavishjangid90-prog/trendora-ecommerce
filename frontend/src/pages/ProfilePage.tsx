import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, LogOut, MapPin, Package, ShieldCheck, User, CircleUserRound, BadgeCheck, Truck } from 'lucide-react';
import { OrderHistoryItem, User as AppUser } from '../types';
import { useStore } from '../store/useStore';
import { usePageMeta } from '../lib/usePageMeta';
import { apiFetch, assetUrl } from '../config';

type AuthMode = 'login' | 'register';

const emptyCredentials = { name: '', email: '', password: '' };

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const authToken = useStore((state) => state.authToken);
  const setAuthSession = useStore((state) => state.setAuthSession);
  const clearAuthSession = useStore((state) => state.clearAuthSession);

  const [mode, setMode] = useState<AuthMode>('login');
  const [credentials, setCredentials] = useState(emptyCredentials);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(Boolean(authToken));
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);

  usePageMeta({
    title: 'My Profile | Trendora',
    description: 'Manage your Trendora account, view order history, and track deliveries.',
  });

  const authHeaders = useMemo(() => (
    authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {}
  ), [authToken]);

  const loadAccount = async () => {
    if (!authToken) {
      setBootstrapping(false);
      return;
    }

    setMessage('');
    try {
      const [meData, orderData] = await Promise.all([
        apiFetch<{ user: AppUser }>('/api/auth/me', { headers: authHeaders }),
        apiFetch<OrderHistoryItem[]>('/api/orders/me', { headers: authHeaders }),
      ]);

      setAuthSession(meData.user, authToken);
      setOrders(orderData);
    } catch (error) {
      clearAuthSession();
      setOrders([]);
      setMessage(error instanceof Error ? error.message : 'Account load nahi ho paya.');
    } finally {
      setBootstrapping(false);
    }
  };

  useEffect(() => {
    void loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const updateField = (key: keyof typeof emptyCredentials, value: string) => {
    setCredentials((current) => ({ ...current, [key]: value }));
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register'
        ? { name: credentials.name, email: credentials.email, password: credentials.password }
        : { email: credentials.email, password: credentials.password };

      const data = await apiFetch<{ token?: string; user?: AppUser; message?: string }>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!data.token || !data.user) {
        throw new Error(data.message || 'Authentication failed.');
      }

      setAuthSession(data.user, data.token);
      setCredentials(emptyCredentials);
      setMessage(mode === 'register' ? 'Account created successfully.' : 'Welcome back.');
      setMode('login');
      const orderData = await apiFetch<OrderHistoryItem[]>('/api/orders/me', {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      setOrders(orderData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login/register nahi ho paya.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    localStorage.removeItem('trendora-admin-token');
    setOrders([]);
    setMessage('Signed out.');
    navigate('/', { replace: true });
  };

  const accountStats = [
    { icon: Package, label: 'Orders', value: String(orders.length) },
    { icon: BadgeCheck, label: 'Status', value: user?.role || 'guest' },
    { icon: Truck, label: 'Tracking', value: orders.filter((order) => order.trackingId).length.toString() },
  ];

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading account...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="border-b border-gray-100 bg-white px-4 py-5">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-500">Account</p>
        <h1 className="mt-2 text-2xl font-black text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Orders, addresses, and account details in one place.</p>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          {user ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
                  {user.avatar ? (
                    <img src={assetUrl(user.avatar)} alt={user.name} className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <CircleUserRound size={28} />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {accountStats.map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <item.icon size={18} className="text-gray-700" />
                    <p className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                    <p className="text-sm font-black text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-pink-500">
                <User size={16} /> Sign in
              </div>
              <div className="mb-4 flex rounded-full border border-gray-100 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-bold ${mode === 'login' ? 'bg-black text-white' : 'text-gray-600'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-bold ${mode === 'register' ? 'bg-black text-white' : 'text-gray-600'}`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {mode === 'register' && (
                  <input
                    required
                    value={credentials.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="Full name"
                    className="h-12 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-black"
                  />
                )}
                <input
                  required
                  value={credentials.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="Email address"
                  type="email"
                  className="h-12 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-black"
                />
                <input
                  required
                  value={credentials.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="Password"
                  type="password"
                  className="h-12 w-full rounded-xl border border-gray-200 px-3 outline-none focus:border-black"
                />

                <button
                  disabled={loading}
                  className="h-12 w-full rounded-full bg-black font-bold text-white disabled:opacity-60"
                >
                  {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Login'}
                </button>
              </form>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Package, title: 'Orders', subtitle: 'Check your order status', path: '#orders' },
              { icon: MapPin, title: 'Addresses', subtitle: 'Use your latest delivery address', path: '#addresses' },
              { icon: CreditCard, title: 'Payments', subtitle: 'Checkout history and receipts', path: '#payments' },
              { icon: ShieldCheck, title: 'Account', subtitle: 'Manage your profile', path: '#account' },
            ].map((item) => (
              <a key={item.title} href={item.path} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-700">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </a>
            ))}
          </div>

          <div id="orders" className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Order history</p>
                <h3 className="text-lg font-black text-gray-900">Recent orders</h3>
              </div>
              <span className="text-xs font-bold text-gray-500">{orders.length} orders</span>
            </div>

            {!user ? (
              <p className="text-sm text-gray-500">Login karne ke baad tumhari order history yahan dikhegi.</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-500">Abhi tak koi order nahi mila.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Link key={order._id} to={`/orders/${order._id}`} className="block rounded-2xl border border-gray-100 p-4 transition-colors hover:bg-gray-50">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-gray-900">{order._id}</p>
                        <p className="mt-1 text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-gray-700">
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <p>Payment: <span className="font-bold text-gray-900">{order.paymentMode}</span></p>
                      <p>Total: <span className="font-bold text-gray-900">₹{Math.round(order.amount / 100)}</span></p>
                      <p>Tracking: <span className="font-bold text-gray-900">{order.trackingId || 'Pending'}</span></p>
                      <p>Invoice: <span className="font-bold text-gray-900">{order.invoiceId || 'Pending'}</span></p>
                    </div>
                    <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                      {order.items?.map((item) => item.product?.name).filter(Boolean).join(', ') || 'No items found'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div id="addresses" className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Addresses</p>
            <h3 className="mt-2 text-lg font-black text-gray-900">Delivery shortcuts</h3>
            <p className="mt-2 text-sm text-gray-500">Latest order address is already stored with your account and reused at checkout.</p>
          </div>

          <div id="payments" className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Payments</p>
            <h3 className="mt-2 text-lg font-black text-gray-900">Checkout controls</h3>
            <p className="mt-2 text-sm text-gray-500">COD aur Razorpay dono supported hain. Logged-in users ki orders history aur tracking yahin sync hoti hai.</p>
          </div>

          <div id="account" className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Account actions</p>
            {user ? (
              <div className="mt-3 space-y-3">
                <Link to="/admin" className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm font-bold text-gray-900">
                  Admin panel
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
                <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Login ke baad account actions yahan dikhenge.</p>
            )}
          </div>

          {message && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-semibold text-gray-700">
              {message}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
