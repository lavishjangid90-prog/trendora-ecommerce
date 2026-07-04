import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { usePageMeta } from '../lib/usePageMeta';
import { apiFetch } from '../config';

const CATEGORIES = ['Streetwear', 'T-Shirts', 'Sneakers', 'Jackets', 'Accessories', "Women's Fashion"];

export function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || CATEGORIES[0];
  const [products, setProducts] = useState<Product[]>([]);

  usePageMeta({
    title: `${selectedCategory} | Trendora`,
    description: `Browse ${selectedCategory.toLowerCase()} products on Trendora.`,
  });

  useEffect(() => {
    apiFetch<Product[]>(`/api/products?category=${encodeURIComponent(selectedCategory)}`)
      .then(setProducts)
      .catch((err) => console.error('Failed to load category', err));
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500 mt-1">Shop clothing by style, fit, and mood.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-4 bg-white">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSearchParams({ category })}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold border ${
              selectedCategory === category
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-4 py-5">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
