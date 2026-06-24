import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Home, ShieldCheck, Truck } from 'lucide-react';
import { CheckoutOrder, DeliveryAddress } from '../types';
import { useStore } from '../store/useStore';
import { usePageMeta } from '../lib/usePageMeta';

const emptyAddress: DeliveryAddress = {
  fullName: '',
  phone: '',
  pincode: '',
  city: '',
  state: '',
  addressLine: '',
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useStore((state) => state.cart);
  const clearCart = useStore((state) => state.clearCart);
  const user = useStore((state) => state.user);
  const authToken = useStore((state) => state.authToken);
  const [address, setAddress] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [message, setMessage] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  usePageMeta({
    title: 'Secure Checkout | Trendora',
    description: 'Complete your Trendora order with secure payment and delivery details.',
  });

  const itemTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const totalDiscount = cart.reduce((total, item) => total + (item.product.originalPrice - item.product.price) * item.quantity, 0);
  const shipping = itemTotal > 999 ? 0 : 99;
  const grandTotal = itemTotal + shipping;
  const stockIssues = cart.filter((item) => typeof item.product.stock === 'number' && item.product.stock < item.quantity);

  const updateAddress = (key: keyof DeliveryAddress, value: string) => {
    setAddress((current) => ({ ...current, [key]: value }));
  };

  const handlePlaceOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cart.length === 0) {
      setMessage('Cart empty hai. Pehle product add karo.');
      return;
    }

    if (stockIssues.length > 0) {
      setMessage(`${stockIssues[0].product.name} ka stock kam hai. Quantity adjust karo.`);
      return;
    }

    setPlacingOrder(true);
    setMessage('');

    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ amount: grandTotal, address, items: cart, paymentMode: paymentMethod }),
    });

    const order: CheckoutOrder = await response.json();
    setPlacingOrder(false);

    if (!response.ok) {
      setMessage(order.message || 'Payment order create nahi ho paya.');
      return;
    }

    if (order.paymentMode === 'mock' || order.paymentMode === 'cod') {
      clearCart();
      setMessage(`${order.message} Demo order id: ${order.orderId}`);
      navigate(`/orders/${order.orderId}`);
      return;
    }

    setMessage(`Razorpay order ready: ${order.orderId}. Checkout widget connect karne ke liye key active hai.`);
  };

  if (cart.length === 0 && !message) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center">
        <Truck size={48} className="mb-4 text-gray-300" />
        <h1 className="text-xl font-bold">Checkout empty hai</h1>
        <p className="mt-2 text-sm text-gray-500">Cart me product add karke checkout continue karo.</p>
        {!user && <p className="mt-2 text-xs text-gray-400">Guest checkout allowed hai, but account login se order history aur tracking milti hai.</p>}
        <button onClick={() => navigate('/')} className="mt-6 rounded-full bg-black px-8 py-3 font-bold text-white">
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-gray-100">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-black">Secure Checkout</h1>
          <p className="text-xs text-gray-500">Address, delivery and payment</p>
        </div>
      </header>

      <form onSubmit={handlePlaceOrder} className="mx-auto grid w-full max-w-7xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:p-6">
          <div className="mb-4 flex items-center gap-2 font-bold">
            <Home size={18} /> Delivery Address
          </div>
          {user && (
            <div className="mb-4 rounded-xl border border-pink-100 bg-pink-50 p-3 text-sm text-pink-700">
              Logged in as <span className="font-black">{user.name}</span>. Order history profile me sync hoga.
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            <input required value={address.fullName} onChange={(event) => updateAddress('fullName', event.target.value)} placeholder="Full name" className="h-12 rounded-xl border border-gray-200 px-3 outline-none" />
            <input required value={address.phone} onChange={(event) => updateAddress('phone', event.target.value)} placeholder="Mobile number" className="h-12 rounded-xl border border-gray-200 px-3 outline-none" />
            <textarea required value={address.addressLine} onChange={(event) => updateAddress('addressLine', event.target.value)} placeholder="House no, street, area" className="min-h-24 rounded-xl border border-gray-200 p-3 outline-none" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input required value={address.pincode} onChange={(event) => updateAddress('pincode', event.target.value)} placeholder="Pincode" className="h-12 rounded-xl border border-gray-200 px-3 outline-none" />
              <input required value={address.city} onChange={(event) => updateAddress('city', event.target.value)} placeholder="City" className="h-12 rounded-xl border border-gray-200 px-3 outline-none" />
              <input required value={address.state} onChange={(event) => updateAddress('state', event.target.value)} placeholder="State" className="h-12 rounded-xl border border-gray-200 px-3 outline-none" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:p-6">
          <div className="mb-4 flex items-center gap-2 font-bold">
            <CreditCard size={18} /> Payment Method
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button type="button" onClick={() => setPaymentMethod('razorpay')} className={`rounded-xl border p-4 text-left text-sm font-bold ${paymentMethod === 'razorpay' ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
              Razorpay
              <span className="block text-xs font-medium opacity-70">UPI, cards, netbanking</span>
            </button>
            <button type="button" onClick={() => setPaymentMethod('cod')} className={`rounded-xl border p-4 text-left text-sm font-bold ${paymentMethod === 'cod' ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
              Cash on Delivery
              <span className="block text-xs font-medium opacity-70">Pay after delivery</span>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:row-span-2 lg:h-max lg:p-6">
          <h2 className="mb-3 font-bold">Order Summary</h2>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Total MRP</span><span>₹{itemTotal + totalDiscount}</span></div>
            <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{totalDiscount}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="mt-2 flex justify-between border-t border-gray-100 pt-3 text-base font-black text-gray-900"><span>Total</span><span>₹{grandTotal}</span></div>
          </div>
          {stockIssues.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {stockIssues[0].product.name} currently available stock se zyada quantity hai.
            </div>
          )}
        </section>

        {message && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700 lg:col-span-2">
            <ShieldCheck size={18} className="mb-2" /> {message}
          </div>
        )}

        <button disabled={placingOrder} className="h-14 rounded-full bg-black font-black text-white disabled:opacity-60 lg:col-span-2">
          {placingOrder ? 'PLACING ORDER...' : `PLACE ORDER ₹${grandTotal}`}
        </button>
      </form>
    </div>
  );
}
