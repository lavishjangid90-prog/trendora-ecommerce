import { ProductCard } from '../components/ProductCard';
import { useStore } from '../store/useStore';
import { HeartCrack } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '../lib/usePageMeta';

export function WishlistPage() {
  const wishlist = useStore((state) => state.wishlist);
  const navigate = useNavigate();

  usePageMeta({
    title: 'Wishlist | Trendora',
    description: 'Save your favorite Trendora products for later.',
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="px-4 py-4">
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Wishlist</h1>
        <p className="text-sm text-gray-500 mb-6">{wishlist.length} item(s)</p>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-gray-300 mb-4">
              <HeartCrack size={48} />
            </div>
            <h2 className="text-lg font-bold mb-2">Nothing to see here</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-[250px]">Save your favorite items to your wishlist and they will appear here.</p>
            <button onClick={() => navigate('/')} className="bg-black text-white px-8 py-3 rounded-full font-bold">
              Explore Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-20">
            {wishlist.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
