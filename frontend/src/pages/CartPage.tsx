import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Minus, Plus, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { usePageMeta } from '../lib/usePageMeta';

export function CartPage() {
  const navigate = useNavigate();
  const cart = useStore(state => state.cart);
  const updateQuantity = useStore(state => state.updateQuantity);
  const removeFromCart = useStore(state => state.removeFromCart);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const itemTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const totalDiscount = cart.reduce((total, item) => total + ((item.product.originalPrice - item.product.price) * item.quantity), 0);
  const shipping = itemTotal > 0 ? (itemTotal > 999 ? 0 : 99) : 0;
  const grandTotal = itemTotal + shipping;

  usePageMeta({
    title: 'Shopping Cart | Trendora',
    description: 'Review cart items and proceed to secure Trendora checkout.',
  });

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      navigate('/checkout');
    }, 500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:pt-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-black hover:bg-gray-100 mr-2">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold">Shopping Bag</h1>
          <span className="text-xs text-gray-500">{cart.length} items</span>
        </div>
      </header>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-gray-300 mb-4">
            <Trash2 size={48} />
          </div>
          <h2 className="text-lg font-bold mb-2">Your Bag is Empty</h2>
          <p className="text-sm text-gray-500 mb-8 text-center">Looks like you haven't added anything to your cart yet.</p>
          <button onClick={() => navigate('/')} className="bg-black text-white px-8 py-3 rounded-full font-bold">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-7xl gap-6 p-4 pb-40 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-8">
          {/* Cart Items */}
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {cart.map((item) => {
                const maxStock = typeof item.product.stock === 'number' ? item.product.stock : Number.POSITIVE_INFINITY;
                const atStockLimit = item.quantity >= maxStock;

                return (
                  <motion.div
                    key={`${item.product._id}-${item.selectedColor}-${item.selectedSize}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row"
                  >
                    <img src={item.product.image} className="h-48 w-full rounded-xl bg-gray-100 object-cover sm:h-32 sm:w-24" alt={item.product.name} />

                    <div className="flex flex-col flex-1 py-1">
                      <div className="mb-1 flex items-start justify-between">
                        <h3 className="pr-4 text-sm font-semibold leading-tight text-gray-900">{item.product.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.product._id, item.selectedSize, item.selectedColor)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className="mb-2 text-xs text-gray-500">Size: {item.selectedSize} | Color: {item.selectedColor}</p>

                      <div className="mb-3 mt-auto flex items-baseline gap-2">
                        <span className="leading-none font-bold text-gray-900">₹{item.product.price}</span>
                        {item.product.originalPrice > item.product.price && (
                          <span className="text-xs text-gray-400 line-through">₹{item.product.originalPrice}</span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center gap-4">
                        <div className="flex items-center rounded-full border border-gray-200 bg-gray-50">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center text-gray-600"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                            disabled={atStockLimit}
                            className="flex h-8 w-8 items-center justify-center text-gray-600 disabled:opacity-30"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        {atStockLimit && <span className="text-xs font-semibold text-amber-600">Stock limit reached</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* Bill Details */}
          <div className="flex h-max flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:sticky lg:top-24">
             <h3 className="font-bold text-sm mb-1 uppercase tracking-wider text-gray-900">Price Details</h3>
             
             <div className="flex justify-between text-sm text-gray-600">
               <span>Total MRP</span>
               <span>₹{itemTotal + totalDiscount}</span>
             </div>
             
             <div className="flex justify-between text-sm text-green-600">
               <span>Discount on MRP</span>
               <span>-₹{totalDiscount}</span>
             </div>
             
             <div className="flex justify-between text-sm text-gray-600">
               <span>Platform Fee</span>
               <span>FREE</span>
             </div>

             <div className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-3">
               <span>Shipping Fee</span>
               <span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
             </div>
             
             <div className="flex justify-between font-bold text-gray-900 pt-1">
               <span>Total Amount</span>
               <span>₹{grandTotal}</span>
             </div>
             <button
               onClick={handleCheckout}
               disabled={isProcessing}
               className="mt-3 hidden h-12 rounded-full bg-black font-bold text-white transition-transform active:scale-95 disabled:opacity-50 lg:block"
             >
               {isProcessing ? "PROCESSING..." : "PLACE ORDER"}
             </button>
          </div>

          <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-1 lg:col-span-2">
             <ShieldCheck size={14} /> Safe and Secure Payments. 100% Authentic products.
          </div>
        </div>
      )}

      {/* Checkout Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-gray-100 bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] lg:hidden">
           <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
              <div className="flex flex-col">
                 <span className="text-xl font-bold font-sans">₹{grandTotal}</span>
                 <span className="text-xs font-bold text-blue-600 cursor-pointer">View Details</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="min-w-0 rounded-full bg-black px-5 py-4 font-bold text-white transition-transform active:scale-95 disabled:opacity-50 sm:min-w-[200px]"
              >
                {isProcessing ? "PROCESSING..." : "PLACE ORDER"}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
