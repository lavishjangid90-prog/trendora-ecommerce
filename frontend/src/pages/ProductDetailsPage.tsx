import { apiFetch, assetUrl } from "@/config";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Star, ShoppingBag, Share2, Truck, Ruler } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { usePageMeta } from '../lib/usePageMeta';

export function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  
  const addToCart = useStore(state => state.addToCart);
  const toggleWishlist = useStore(state => state.toggleWishlist);
  const wishlist = useStore(state => state.wishlist);

  usePageMeta({
    title: product ? product.seoTitle || `${product.name} | Trendora` : 'Product Details | Trendora',
    description: product?.seoDescription || product?.description || 'Browse product details on Trendora.',
  });

  useEffect(() => {
    if (!id) return;

    apiFetch<Product>(`/api/products/${id}`)
      .then(data => {
        setProduct(data);
        if (data.sizes?.length) setSelectedSize(data.sizes[0]);
        if (data.colors?.length) setSelectedColor(data.colors[0]);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load product", err);
        setLoading(false);
      });
  }, [id]);
     
   if (loading){
    return (
          <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
   }
   
   if (!product) return <div className="h-screen w-full flex items-center justify-center font-mono">Product Not Found</div>;

  const isWishlisted = wishlist.some((w) => w._id === product._id);
  const stockAvailable = Number(product.stock ?? 0);

  const handleAddToCart = () => {
    if (stockAvailable <= 0) return;
    addToCart({
      product,
      quantity: 1,
      selectedSize,
      selectedColor
    });
    // Optional: show a toast here
  };

  const handleBuyNow = () => {
    if (stockAvailable <= 0) return;
    addToCart({
      product,
      quantity: 1,
      selectedSize,
      selectedColor
    });
    navigate('/checkout');
  };

  return (
    <div className="relative min-h-[100dvh] bg-white pb-28 lg:pb-0">
      {/* Absolute Back Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 px-4 bg-gradient-to-b from-black/20 to-transparent pt-safe">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/80 backdrop-blur-md rounded-full text-black">
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button className="p-2 bg-white/80 backdrop-blur-md rounded-full text-black">
            <Share2 size={20} />
          </button>
          <button onClick={() => toggleWishlist(product)} className="p-2 bg-white/80 backdrop-blur-md rounded-full text-black">
            <Heart size={20} className={cn(isWishlisted && "fill-red-500 text-red-500")} />
          </button>
        </div>
      </div>

      {/* Product Image Stage */}
      <div className="mx-auto grid w-full max-w-7xl lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:gap-8 lg:px-6 lg:pt-20">
        {/* Product Image Stage */}
        <div className="relative aspect-[4/5] w-full bg-gray-100 lg:sticky lg:top-20 lg:aspect-[5/6] lg:max-h-[calc(100vh-6rem)] lg:overflow-hidden lg:rounded-3xl">
          <img src={assetUrl(product.image)} alt={product.name} className="h-full w-full object-cover" />
        </div>

        {/* Product Info */}
        <div className="relative z-10 -mt-4 flex flex-col rounded-t-3xl border-t border-gray-100 bg-white p-4 lg:mt-0 lg:rounded-none lg:border-t-0 lg:p-0 lg:pb-32">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
          TRENDING • {product.category}
        </div>
        
        <h1 className="text-2xl font-bold leading-tight font-sans text-gray-900 mb-2 sm:text-3xl lg:text-4xl">
          {product.name}
        </h1>
        
        <div className="flex flex-wrap items-baseline gap-3 mb-4">
          <span className="text-2xl font-black text-gray-900 sm:text-3xl">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-sm font-medium text-gray-400 line-through">₹{product.originalPrice}</span>
          )}
          {product.discount > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-sm uppercase tracking-wider">
              {product.discount}% OFF
            </span>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className={`rounded-full px-3 py-1 font-bold ${stockAvailable > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {stockAvailable > 0 ? `${stockAvailable} in stock` : 'Out of stock'}
          </span>
          {product.stock !== undefined && <span className="text-gray-400">Live inventory updated by admin</span>}
        </div>

        <div className="flex items-center gap-1 text-sm font-medium border border-gray-200 rounded-full w-max px-3 py-1 mb-6">
          <span className="font-bold">{product.rating}</span>
          <Star size={14} className="fill-green-600 text-green-600" />
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-gray-500 cursor-pointer">{product.reviews} Reviews</span>
        </div>

        {/* Dynamic Selection: Colors */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3 flex justify-between">
            <span>Select Color: <span className="font-medium text-gray-500">{selectedColor}</span></span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {product.colors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "p-1 rounded-full border-2 transition-all",
                  selectedColor === color ? "border-black" : "border-transparent"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-full border border-gray-200" 
                  style={{ backgroundColor: color.toLowerCase().replace('floral ', '') === 'black' ? '#222' : color.toLowerCase().replace('floral ', '') === 'white' ? '#fff' : color.toLowerCase() }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Selection: Sizes */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
            <span>Select Size</span>
            <span className="text-xs text-blue-600 flex items-center gap-1 font-semibold cursor-pointer"><Ruler size={12}/> Size Chart</span>
          </h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {product.sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "min-w-14 h-14 flex items-center justify-center rounded-full font-bold text-sm transition-all border shrink-0",
                  selectedSize === size 
                    ? "bg-black text-white border-black" 
                    : "bg-white text-gray-800 border-gray-200 hover:border-gray-800"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[1px] bg-gray-100 my-6"></div>

        {/* Delivery Features */}
        <div className="flex flex-col gap-4 mb-6">
           <h3 className="text-sm font-bold">Delivery & Services</h3>
           <div className="flex gap-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
             <Truck size={20} className="shrink-0 text-black" />
             <div>
               <p className="font-semibold text-gray-900 mb-1">Get it by Tomorrow</p>
               <p className="text-xs">Pay on delivery available.</p>
             </div>
           </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
           <h3 className="text-sm font-bold">Product Details</h3>
           <p className="text-sm text-gray-600 leading-relaxed">
             {product.description}
           </p>
        </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-gray-100 bg-white p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
         <div className="mx-auto flex w-full max-w-7xl gap-3">
            <button 
              onClick={handleAddToCart}
              disabled={stockAvailable <= 0}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-black bg-white px-3 text-sm font-bold text-black transition-transform active:scale-95 sm:text-base"
            >
             <ShoppingBag size={20} />
             ADD TO CART
            </button>
            <button 
              onClick={handleBuyNow}
              disabled={stockAvailable <= 0}
              className="flex h-14 flex-1 items-center justify-center rounded-full bg-black px-3 text-sm font-bold text-white transition-transform active:scale-95 sm:text-base"
            >
             BUY NOW
            </button>
         </div>
      </div>
    </div>
  );
}
