import { FormEvent, useEffect, useState } from 'react';
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

const RAZORPAY_CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: {
    ondismiss: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpayCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      console.log('[Razorpay] Checkout script already available.');
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CHECKOUT_SCRIPT}"]`);
    if (existingScript) {
      console.log('[Razorpay] Waiting for existing checkout script tag.');
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Razorpay checkout script failed to load.')), { once: true });
      return;
    }

    console.log('[Razorpay] Loading checkout script:', RAZORPAY_CHECKOUT_SCRIPT);
    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => {
      console.log('[Razorpay] Checkout script loaded.');
      resolve();
    };
    script.onerror = () => reject(new Error('Razorpay checkout script blocked or failed to load.'));
    document.body.appendChild(script);
  });
}

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

  useEffect(() => {
    loadRazorpayCheckout().catch((error) => {
      console.warn('[Razorpay] Checkout script preload failed:', error);
    });
  }, []);

  const itemTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const totalDiscount = cart.reduce((total, item) => total + (item.product.originalPrice - item.product.price) * item.quantity, 0);
  const shipping = itemTotal > 999 ? 0 : 99;
  const grandTotal = itemTotal + shipping;
  const stockIssues = cart.filter((item) => typeof item.product.stock === 'number' && item.product.stock < item.quantity);

  const updateAddress = (key: keyof DeliveryAddress, value: string) => {
    setAddress((current) => ({ ...current, [key]: value }));
  };

  const recordPaymentFailure = async (orderId: string, reason: string) => {
    try {
      console.warn('[Razorpay] Recording payment failure:', { orderId, reason });
      await fetch(`/api/orders/${orderId}/payment-failed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });
    } catch (error) {
      console.error('[Razorpay] Failed to record payment failure:', error);
    }
  };

  const openRazorpayCheckout = async (order: CheckoutOrder) => {
    console.log('[Razorpay] Preparing checkout widget:', {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      hasKey: Boolean(order.keyId),
    });

    if (!order.keyId || !order.amount || !order.currency) {
      throw new Error('Razorpay checkout details missing from server response.');
    }

    await loadRazorpayCheckout();

    if (!window.Razorpay) {
      throw new Error('Razorpay checkout script loaded, but window.Razorpay is unavailable.');
    }

    const options: RazorpayOptions = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Trendora',
      description: order.description || `${cart.length} Trendora item${cart.length === 1 ? '' : 's'}`,
      order_id: order.orderId,
      prefill: {
        name: order.customer?.name || address.fullName || user?.name || '',
        email: order.customer?.email || user?.email || '',
        contact: order.customer?.contact || address.phone || '',
      },
      notes: {
        orderId: order.orderId,
        products: cart.map((item) => `${item.product.name} x ${item.quantity}`).join(', ').slice(0, 255),
      },
      theme: {
        color: '#111111',
      },
      handler: async (paymentResponse) => {
        console.log('[Razorpay] Payment success callback received:', {
          orderId: paymentResponse.razorpay_order_id,
          paymentId: paymentResponse.razorpay_payment_id,
          hasSignature: Boolean(paymentResponse.razorpay_signature),
        });

        setPlacingOrder(true);
        setMessage('Payment verify ho raha hai...');

        try {
          const verifyResponse = await fetch('/api/orders/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify(paymentResponse),
          });
          const verifyResult = await verifyResponse.json();

          if (!verifyResponse.ok) {
            throw new Error(verifyResult.message || 'Payment verification failed.');
          }

          console.log('[Razorpay] Payment verified by backend:', verifyResult);
          clearCart();
          setMessage('Payment successful. Order place ho gaya hai.');
          if (authToken) {
            navigate(`/orders/${verifyResult.orderId || order.orderId}`);
          }
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Payment verification failed.';
          console.error('[Razorpay] Payment verification error:', error);
          setMessage(`Payment complete hua, lekin verification fail ho gaya: ${reason}`);
        } finally {
          setPlacingOrder(false);
        }
      },
      modal: {
        ondismiss: () => {
          const reason = 'Razorpay checkout popup customer ne close kar diya.';
          console.warn('[Razorpay] Checkout modal dismissed:', order.orderId);
          setPlacingOrder(false);
          setMessage(reason);
          recordPaymentFailure(order.orderId, reason);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', (failureResponse) => {
      const description = failureResponse.error?.description || failureResponse.error?.reason || 'Razorpay payment failed.';
      console.error('[Razorpay] Payment failed event:', failureResponse);
      setPlacingOrder(false);
      setMessage(description);
      recordPaymentFailure(order.orderId, description);
    });

    console.log('[Razorpay] Opening checkout popup now.');
    razorpay.open();
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

    try {
      console.log('[Checkout] Creating order:', { amount: grandTotal, paymentMethod, itemCount: cart.length });
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ amount: grandTotal, address, items: cart, paymentMode: paymentMethod }),
      });

      const order: CheckoutOrder = await response.json();
      console.log('[Checkout] Order create response:', {
        ok: response.ok,
        orderId: order.orderId,
        paymentMode: order.paymentMode,
        hasKey: Boolean(order.keyId),
        amount: order.amount,
        currency: order.currency,
      });

      if (!response.ok) {
        setMessage(order.message || 'Payment order create nahi ho paya.');
        setPlacingOrder(false);
        return;
      }

      if (order.paymentMode === 'mock' || order.paymentMode === 'cod') {
        clearCart();
        setMessage(`${order.message} Demo order id: ${order.orderId}`);
        setPlacingOrder(false);
        if (authToken) {
          navigate(`/orders/${order.orderId}`);
        }
        return;
      }

      setMessage(`Razorpay order ready: ${order.orderId}. Checkout popup open ho raha hai...`);
      await openRazorpayCheckout(order);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Checkout start nahi ho paya.';
      console.error('[Checkout] Unable to complete checkout:', error);
      setMessage(reason);
      setPlacingOrder(false);
    }
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
