import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { apiFetch } from '../config';
import { Product, User } from '../types';
import { useStore } from '../store/useStore';
import { usePageMeta } from '../lib/usePageMeta';

const initialForm = { name: '', email: '', businessName: '', city: '', sellerId: '', phone: '', password: '', invitationCode: '', termsAccepted: false };

type DealPackage = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  pricePerDay: number;
  defaultDays: number;
  accent: string;
};

const defaultPackages: DealPackage[] = [
  { id: 'mega-deals', title: 'Mega Deals', subtitle: 'High value steals', price: 299, pricePerDay: 49, defaultDays: 7, accent: 'from-pink-500 via-fuchsia-500 to-violet-500' },
  { id: 'today-deals', title: 'Today Deals', subtitle: 'Daily limited offers', price: 199, pricePerDay: 35, defaultDays: 5, accent: 'from-orange-500 via-rose-500 to-pink-500' },
  { id: 'flash-sale', title: 'Flash Sale', subtitle: 'Urgency-driven picks', price: 249, pricePerDay: 40, defaultDays: 4, accent: 'from-violet-500 via-indigo-500 to-sky-500' },
  { id: 'best-price', title: 'Best Price', subtitle: 'Budget-friendly value', price: 179, pricePerDay: 30, defaultDays: 3, accent: 'from-emerald-500 via-teal-500 to-cyan-500' },
];

export function SellerPortalPage() {
  const navigate = useNavigate();
  const setAuthSession = useStore((state) => state.setAuthSession);
  const clearAuthSession = useStore((state) => state.clearAuthSession);
  const currentUser = useStore((state) => state.user);
  const authToken = useStore((state) => state.authToken);
  const [dashboard, setDashboard] = useState<{ products: number; orders: number; grossSales: number; pendingApprovals: number } | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [dealPackages, setDealPackages] = useState<DealPackage[]>(defaultPackages);
  const [promoForm, setPromoForm] = useState({ productId: '', placement: defaultPackages[0].id, amount: String(defaultPackages[0].price), days: String(defaultPackages[0].defaultDays) });
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  usePageMeta({ title: 'Seller Portal | Trendora', description: 'Create and manage your Trendora seller account.' });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'seller' || !authToken) return;

    Promise.all([
      apiFetch<any>('/api/seller/dashboard', { headers: { Authorization: `Bearer ${authToken}` } }),
      apiFetch<any>('/api/fulfillment/config', { headers: { Authorization: `Bearer ${authToken}` } }),
      apiFetch<Product[]>('/api/products'),
    ])
      .then(([dashboardData, configData, productsData]) => {
        const availableProducts = (productsData || []).filter((product) => product.sellerId === currentUser._id);
        setDashboard(dashboardData);
        setDealPackages(Array.isArray(configData?.dealBoxes) && configData.dealBoxes.length ? configData.dealBoxes : defaultPackages);
        setSellerProducts(availableProducts);

        if (availableProducts.length && !promoForm.productId) {
          const firstPackage = (configData?.dealBoxes || defaultPackages)[0] || defaultPackages[0];
          setPromoForm((current) => ({
            ...current,
            productId: availableProducts[0]._id,
            placement: firstPackage.id,
            amount: String(firstPackage.price),
            days: String(firstPackage.defaultDays),
          }));
        }
      })
      .catch((e) => setMessage(e.message || 'Seller data load failed.'));
  }, [currentUser, authToken, promoForm.productId]);

  if (currentUser?.role === 'seller' && dashboard) {
    return (
      <main className="min-h-screen bg-[#fff8fd] p-4 sm:p-6">
        <section className="mx-auto max-w-6xl rounded-3xl bg-white p-5 shadow-xl sm:p-7">
          <p className="text-xs font-black uppercase tracking-[.2em] text-pink-500">Active supplier</p>
          <h1 className="mt-2 text-3xl font-black text-[#55205f]">Supplier Studio</h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">{[["Products", dashboard.products], ["Orders", dashboard.orders], ["Gross sales", `₹${dashboard.grossSales}`], ["In review", dashboard.pendingApprovals]].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-fuchsia-50 p-4"><p className="text-xs font-bold text-gray-500">{label}</p><p className="mt-1 text-2xl font-black text-[#55205f]">{value}</p></div>)}</div>

          <div className="mt-8 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-500">Home Deals</p>
                <h2 className="mt-1 text-xl font-black text-[#55205f]">Seller ad placements</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#55205f]">{sellerProducts.length} products</span>
            </div>

            <form className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr_auto]" onSubmit={async (event) => {
              event.preventDefault();
              if (!promoForm.productId) {
                setMessage('Pehle product select karo.');
                return;
              }
              const selectedPackage = dealPackages.find((item) => item.id === promoForm.placement) || dealPackages[0];
              const amount = Number(promoForm.amount || selectedPackage.price);
              const days = Number(promoForm.days || selectedPackage.defaultDays);
              try {
                setLoading(true); setMessage('');
                await apiFetch(`/api/products/${promoForm.productId}/promote`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                  body: JSON.stringify({ amount, days, placement: promoForm.placement }),
                });
                setMessage(`Ad placement activated for ${selectedPackage.title}.`);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Promotion failed.');
              } finally {
                setLoading(false);
              }
            }}>
              <select value={promoForm.productId} onChange={(event) => setPromoForm((current) => ({ ...current, productId: event.target.value }))} className="h-12 rounded-xl border border-pink-100 bg-white px-3 text-sm outline-none focus:border-[#55205f]">
                <option value="">Select product</option>
                {sellerProducts.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
              </select>

              <select value={promoForm.placement} onChange={(event) => {
                const nextPackage = dealPackages.find((item) => item.id === event.target.value) || dealPackages[0];
                setPromoForm((current) => ({ ...current, placement: nextPackage.id, amount: String(nextPackage.price), days: String(nextPackage.defaultDays) }));
              }} className="h-12 rounded-xl border border-pink-100 bg-white px-3 text-sm outline-none focus:border-[#55205f]">
                {dealPackages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.title}</option>)}
              </select>

              <input type="number" min={1} value={promoForm.amount} onChange={(event) => setPromoForm((current) => ({ ...current, amount: event.target.value }))} className="h-12 rounded-xl border border-pink-100 bg-white px-3 text-sm outline-none focus:border-[#55205f]" />
              <input type="number" min={1} max={30} value={promoForm.days} onChange={(event) => setPromoForm((current) => ({ ...current, days: event.target.value }))} className="h-12 rounded-xl border border-pink-100 bg-white px-3 text-sm outline-none focus:border-[#55205f]" />

              <button type="submit" disabled={loading} className="h-12 rounded-full bg-gradient-to-r from-[#55205f] to-pink-600 px-5 text-sm font-black text-white disabled:opacity-60">{loading ? 'Processing...' : 'Buy placement'}</button>
            </form>
            <p className="mt-3 text-xs text-gray-500">Admin-set pricing is used for each box. Seller can choose ad days and pay from the same seller panel.</p>
          </div>

          <p className="mt-6 text-sm text-gray-500">Products must be separately submitted and approved by Trendora before customers can view them.</p>
        </section>
      </main>
    );
  }

  const update = (key: keyof typeof initialForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true); setMessage('');
    try {
      const data = await apiFetch<{ token: string; user: User }>('/api/auth/register-seller', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (photo) {
        await apiFetch('/api/auth/avatar', { method: 'PUT', headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': photo.type }, body: photo });
      }
      clearAuthSession();
      setForm(initialForm); setPhoto(null); setMode('login');
      setMessage('Application submit ho gayi. Seller ID aur password se login karein.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Seller application submit nahi ho payi.'); }
    finally { setLoading(false); }
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setMessage('');
    try {
      const data = await apiFetch<{ token: string; user: User }>('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.sellerId, password: form.password }) });
      if (data.user.role !== 'seller') throw new Error('Please use the Customer Profile for customer login.');
      setAuthSession(data.user, data.token); navigate('/admin');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Login nahi ho paya.'); }
    finally { setLoading(false); }
  };

  return <div className="min-h-screen bg-[#fff8fd] px-4 py-10"><main className="mx-auto max-w-lg rounded-3xl border border-pink-100 bg-white p-6 shadow-[0_18px_45px_rgba(139,44,169,0.12)]">
    <div className="flex items-center gap-3"><div className="rounded-2xl bg-gradient-to-br from-[#55205f] to-pink-500 p-3 text-white"><Store size={24} /></div><div><p className="text-xs font-black uppercase tracking-[0.2em] text-pink-500">Trendora Partner</p><h1 className="text-2xl font-black text-[#55205f]">Seller Portal</h1></div></div>
    <p className="mt-4 text-sm text-gray-500">Customer account ke liye <Link to="/profile" className="font-bold text-pink-600">My Profile</Link> use karein.</p>
    <div className="mt-5 flex rounded-full bg-pink-50 p-1"><button onClick={() => setMode('login')} className={`flex-1 rounded-full py-2 text-sm font-bold ${mode === 'login' ? 'bg-gradient-to-r from-[#55205f] to-fuchsia-700 text-white shadow-sm' : 'text-[#735175]'}`}>Seller login</button><button onClick={() => setMode('register')} className={`flex-1 rounded-full py-2 text-sm font-bold ${mode === 'register' ? 'bg-gradient-to-r from-[#55205f] to-fuchsia-700 text-white shadow-sm' : 'text-[#735175]'}`}>Apply as seller</button></div>
    <form onSubmit={mode === 'login' ? login : submit} className="mt-5 space-y-3">
      {mode === 'register' && <><input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" className="field" /><input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email address" className="field" /><input required minLength={3} value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Business / store name" className="field" /><input required minLength={2} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" className="field" /><input required type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Phone number" className="field" /><input required value={form.invitationCode} onChange={(e) => update('invitationCode', e.target.value.toUpperCase())} placeholder="Invitation code" className="field uppercase" /><label className="block text-sm font-semibold text-gray-600">Profile photo <span className="font-normal text-gray-400">(optional)</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-normal" /></label></>}
      <input required value={form.sellerId} onChange={(e) => update('sellerId', e.target.value.toLowerCase())} placeholder="Seller ID" minLength={3} maxLength={32} pattern="[a-zA-Z0-9._-]+" className="field" />
      <input required type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder={mode === 'register' ? 'Password (minimum 8 characters)' : 'Password'} minLength={mode === 'register' ? 8 : 1} className="field" />
      {mode === 'register' && <label className="flex gap-2 text-sm text-gray-600"><input required type="checkbox" checked={form.termsAccepted} onChange={(e) => update('termsAccepted', e.target.checked)} />I confirm my business details are correct and agree to seller review.</label>}
      <button disabled={loading} className="h-12 w-full rounded-full bg-gradient-to-r from-[#55205f] to-pink-600 font-bold text-white shadow-md disabled:opacity-60">{loading ? 'Please wait...' : mode === 'login' ? 'Login to my panel' : 'Submit seller application'}</button>
    </form>{message && <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm font-semibold text-gray-700">{message}</p>}
  </main></div>;
}
