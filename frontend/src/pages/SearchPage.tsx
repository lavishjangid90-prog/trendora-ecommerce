import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { usePageMeta } from '../lib/usePageMeta';
import { apiFetch } from '../config';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ pincode: localStorage.getItem('trendora-pincode') || '', city: localStorage.getItem('trendora-city') || '', state: localStorage.getItem('trendora-state') || '' });
  const [localOnly, setLocalOnly] = useState(false);

  usePageMeta({
    title: 'Search Products | Trendora',
    description: 'Search Trendora products by style, category, or keyword.',
  });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ search: query, ...location, ...(localOnly ? { local: 'local' } : {}) });
    apiFetch<Product[]>(`/api/products?${params}`, { signal: controller.signal })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to search products', err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query, location, localOnly]);

  const updateLocation = (key: keyof typeof location, value: string) => { const next = { ...location, [key]: value }; setLocation(next); localStorage.setItem(`trendora-${key}`, value); };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3 rounded-full bg-gray-100 px-4 h-12">
          <Search size={20} className="text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            placeholder="Search shirts, hoodies, jackets..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <SlidersHorizontal size={18} className="text-gray-500" />
        </div>
        <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input value={location.pincode} onChange={(e) => updateLocation('pincode', e.target.value)} placeholder="Pincode" className="min-w-0 rounded-lg border px-2 py-2 text-xs" />
          <input value={location.city} onChange={(e) => updateLocation('city', e.target.value)} placeholder="City" className="min-w-0 rounded-lg border px-2 py-2 text-xs" />
          <input value={location.state} onChange={(e) => updateLocation('state', e.target.value)} placeholder="State" className="min-w-0 rounded-lg border px-2 py-2 text-xs" />
          <button type="button" onClick={() => setLocalOnly((value) => !value)} className={`rounded-lg px-2 text-xs font-bold ${localOnly ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Near me</button>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">
            {query ? `Results for "${query}"` : 'Explore clothing'}
          </h1>
          <span className="text-xs font-semibold text-gray-500">{products.length} items</span>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Searching...</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
