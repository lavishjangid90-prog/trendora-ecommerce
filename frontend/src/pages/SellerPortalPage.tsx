import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { apiFetch } from '../config';
import { User } from '../types';
import { useStore } from '../store/useStore';
import { usePageMeta } from '../lib/usePageMeta';

const initialForm = { name: '', email: '', businessName: '', city: '', sellerId: '', phone: '', password: '', termsAccepted: false };

export function SellerPortalPage() {
  const navigate = useNavigate();
  const setAuthSession = useStore((state) => state.setAuthSession);
  const clearAuthSession = useStore((state) => state.clearAuthSession);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  usePageMeta({ title: 'Seller Portal | Trendora', description: 'Create and manage your Trendora seller account.' });
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
      // New sellers are manually reviewed, so do not keep a pending account logged in.
      clearAuthSession();
      setForm(initialForm); setPhoto(null); setMode('login');
      setMessage('Application submit ho gayi. Master admin approval ke baad Seller ID aur password se login karein.');
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

  return <div className="min-h-screen bg-gray-50 px-4 py-10"><main className="mx-auto max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3"><div className="rounded-2xl bg-black p-3 text-white"><Store size={24} /></div><div><p className="text-xs font-black uppercase tracking-[0.2em] text-pink-500">Trendora</p><h1 className="text-2xl font-black text-gray-900">Seller Portal</h1></div></div>
    <p className="mt-4 text-sm text-gray-500">Customer account ke liye <Link to="/profile" className="font-bold text-pink-600">My Profile</Link> use karein.</p>
    <div className="mt-5 flex rounded-full bg-gray-100 p-1"><button onClick={() => setMode('login')} className={`flex-1 rounded-full py-2 text-sm font-bold ${mode === 'login' ? 'bg-black text-white' : ''}`}>Seller login</button><button onClick={() => setMode('register')} className={`flex-1 rounded-full py-2 text-sm font-bold ${mode === 'register' ? 'bg-black text-white' : ''}`}>Apply as seller</button></div>
    <form onSubmit={mode === 'login' ? login : submit} className="mt-5 space-y-3">
      {mode === 'register' && <><input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" className="field" /><input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email address" className="field" /><input required minLength={3} value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Business / store name" className="field" /><input required minLength={2} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" className="field" /><input required type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Phone number" className="field" /><label className="block text-sm font-semibold text-gray-600">Profile photo <span className="font-normal text-gray-400">(optional)</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-normal" /></label></>}
      <input required value={form.sellerId} onChange={(e) => update('sellerId', e.target.value.toLowerCase())} placeholder="Seller ID" minLength={3} maxLength={32} pattern="[a-zA-Z0-9._-]+" className="field" />
      <input required type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder={mode === 'register' ? 'Password (minimum 8 characters)' : 'Password'} minLength={mode === 'register' ? 8 : 1} className="field" />
      {mode === 'register' && <label className="flex gap-2 text-sm text-gray-600"><input required type="checkbox" checked={form.termsAccepted} onChange={(e) => update('termsAccepted', e.target.checked)} />I confirm my business details are correct and agree to seller review.</label>}
      <button disabled={loading} className="h-12 w-full rounded-full bg-black font-bold text-white disabled:opacity-60">{loading ? 'Please wait...' : mode === 'login' ? 'Login to my panel' : 'Submit seller application'}</button>
    </form>{message && <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm font-semibold text-gray-700">{message}</p>}
  </main></div>;
}
