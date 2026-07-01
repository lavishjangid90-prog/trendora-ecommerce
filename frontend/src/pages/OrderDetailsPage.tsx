import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, CircleDashed, Clock3, MapPin, Package, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
import { OrderHistoryItem } from '../types';
import { useStore } from '../store/useStore';
import { usePageMeta } from '../lib/usePageMeta';

export function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authToken = useStore((state) => state.authToken);
  const [order, setOrder] = useState<OrderHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'cancel' | 'return' | ''>('');
  const [message, setMessage] = useState('');

  usePageMeta({
    title: `Order ${id || ''} | Trendora`,
    description: 'View order status, tracking, and return/cancel controls on Trendora.',
  });

  const authHeaders = useMemo(() => (
    authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {}
  ), [authToken]);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      setLoading(true);
      setMessage('');
      try {
        const response = await fetch(`/api/orders/${id}`, { headers: authHeaders });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Order load nahi ho paya.');
        }
        setOrder(data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Order load nahi ho paya.');
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [authHeaders, id]);

  const updateOrder = async (endpoint: 'cancel' | 'return-request', loadingKey: 'cancel' | 'return') => {
    if (!id) return;
    setActionLoading(loadingKey);
    setMessage('');
    try {
      const response = await fetch(`/api/orders/${id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Action failed.');
      }
      setOrder(data.order as OrderHistoryItem);
      setMessage(endpoint === 'cancel' ? 'Order cancelled successfully.' : 'Return request submitted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  const steps = [
    { key: 'placed', label: 'Placed', icon: BadgeCheck },
    { key: 'packed', label: 'Packed', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading order...
      </div>
    );
  }

  if (!authToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <CircleDashed size={44} className="mb-4 text-gray-300" />
        <h1 className="text-xl font-black text-gray-900">Login required</h1>
        <p className="mt-2 max-w-md text-sm text-gray-500">Order details dekhne ke liye account login chahiye.</p>
        <button onClick={() => navigate('/profile')} className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-bold text-white">
          Go to profile
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <CircleDashed size={44} className="mb-4 text-gray-300" />
        <h1 className="text-xl font-black text-gray-900">Order not found</h1>
        <p className="mt-2 max-w-md text-sm text-gray-500">{message || 'This order could not be loaded.'}</p>
        <button onClick={() => navigate('/profile')} className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-bold text-white">
          Back to profile
        </button>
      </div>
    );
  }

  const canCancel = ['created', 'placed', 'packed'].includes(order.status);
  const canReturn = order.status === 'delivered';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-500">Order Details</p>
            <h1 className="text-lg font-black text-gray-900">{order._id}</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Current status</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">{order.status}</h2>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-gray-700">
                {order.paymentStatus || order.paymentMode}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Amount</p>
                <p className="text-lg font-black text-gray-900">₹{Math.round(order.amount / 100)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Tracking</p>
                <p className="text-lg font-black text-gray-900">{order.trackingId || 'Pending'}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Invoice</p>
                <p className="text-lg font-black text-gray-900">{order.invoiceId || 'Pending'}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Placed at</p>
                <p className="text-sm font-black text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              {order.razorpayPaymentId && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment ID</p>
                  <p className="text-sm font-black text-gray-900">{order.razorpayPaymentId}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-black text-gray-900">
              <Clock3 size={18} /> Tracking timeline
            </div>
            <div className="space-y-3">
              {steps.map((step) => {
                const active = order.status === step.key || (order.statusHistory || []).some((entry) => entry.status === step.key);
                return (
                  <div key={step.key} className={`flex items-center gap-3 rounded-xl border p-3 ${active ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-700'}`}>
                    <step.icon size={18} />
                    <div>
                      <p className="text-sm font-black">{step.label}</p>
                      <p className={`text-xs ${active ? 'text-white/70' : 'text-gray-500'}`}>
                        {active ? 'Completed or active' : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-black text-gray-900">
              <Package size={18} /> Items
            </div>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={`${item.product?._id || index}-${index}`} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                  <img src={item.product?.image} alt={item.product?.name} className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-gray-900">{item.product?.name}</p>
                    <p className="text-xs text-gray-500">
                      Size {item.selectedSize || '-'} · Color {item.selectedColor || '-'} · Qty {item.quantity || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-black text-gray-900">
              <RefreshCcw size={18} /> Status log
            </div>
            <div className="space-y-3">
              {(order.statusHistory || []).length ? (
                order.statusHistory!.slice().reverse().map((entry) => (
                  <div key={`${entry.status}-${entry.at}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-sm font-black text-gray-900">{entry.status}</p>
                    <p className="text-xs text-gray-500">{entry.note}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-gray-400">{new Date(entry.at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No activity yet.</p>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-black text-gray-900">
              <MapPin size={18} /> Delivery address
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-black text-gray-900">{order.address?.fullName || order.customerName || 'Customer'}</p>
              <p>{order.address?.phone || 'Phone not available'}</p>
              <p>{order.address?.addressLine || 'Address not available'}</p>
              <p>{order.address?.city || ''} {order.address?.state ? `, ${order.address.state}` : ''} {order.address?.pincode ? `- ${order.address.pincode}` : ''}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-black text-gray-900">
              <ShieldCheck size={18} /> Actions
            </div>
            <div className="space-y-3">
              <button
                onClick={() => updateOrder('cancel', 'cancel')}
                disabled={!canCancel || actionLoading !== ''}
                className="flex h-12 w-full items-center justify-center rounded-full border border-red-200 bg-red-50 text-sm font-black text-red-600 disabled:opacity-50"
              >
                {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel order'}
              </button>
              <button
                onClick={() => updateOrder('return-request', 'return')}
                disabled={!canReturn || actionLoading !== ''}
                className="flex h-12 w-full items-center justify-center rounded-full border border-black bg-black text-sm font-black text-white disabled:opacity-50"
              >
                {actionLoading === 'return' ? 'Submitting...' : 'Request return'}
              </button>
              <Link to="/profile" className="flex h-12 w-full items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-black text-gray-900">
                Back to profile
              </Link>
            </div>
            {message && <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm font-semibold text-gray-700">{message}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
