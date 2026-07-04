import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { assetUrl } from '../config';

export function ProductCard({ product }: { product: Product }) {
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const wishlist = useStore((state) => state.wishlist);
  
  const isWishlisted = wishlist.some((w) => w._id === product._id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex w-full flex-col gap-2"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-fuchsia-50 shadow-sm ring-1 ring-pink-100/80">
        <Link to={`/product/${product._id}`}>
          <img 
            src={assetUrl(product.image)}
            alt={product.name} 
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className="absolute right-2 top-2 z-10 rounded-full bg-white/85 p-2 text-[#55205f] shadow-sm backdrop-blur-sm transition-colors hover:text-pink-600"
        >
          <Heart size={18} className={cn(isWishlisted && "fill-pink-500 text-pink-500")} />
        </button>
        {product.discount > 0 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-gradient-to-r from-fuchsia-700 to-pink-500 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
            {product.discount}% OFF
          </span>
        )}
        {product.stock !== undefined && (
          <span className={`absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-[10px] font-black shadow-sm ${product.stock > 0 ? 'bg-white/90 text-gray-800' : 'bg-rose-500 text-white'}`}>
            {product.stock > 0 ? `${product.stock} left` : 'Sold out'}
          </span>
        )}
      </div>
      
      <Link to={`/product/${product._id}`} className="flex flex-col gap-1 px-1">
        <div className="flex items-start justify-between">
          <h3 className="line-clamp-1 text-sm font-bold text-[#55205f]">{product.name}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-fuchsia-300">
          <Star size={12} className="fill-pink-400 text-pink-400" />
          <span>{product.rating}</span>
          <span className="text-fuchsia-200">({product.reviews})</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-black text-pink-600">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
