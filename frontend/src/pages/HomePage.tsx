import { apiFetch, assetUrl } from "@/config";
import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, Sparkles, Tag, TrendingUp, Truck, Zap } from 'lucide-react';
import { usePageMeta } from '../lib/usePageMeta';

type HomeBanner = {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  placement: 'homepage' | 'promotional';
  active: boolean;
};

const CATEGORIES = [
  {
    id: 1,
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Footwear",
    image:
      "https://images.unsplash.com/photo-1552346154-21d32810baa3?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Bags",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Watches",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "Jewellery",
    image:
      "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: 7,
    name: "T-Shirts",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop",
  },
];

const quickTiles = [
  { title: 'Mega Deals', subtitle: 'Up to 70% off', icon: Tag },
  { title: 'Flash Sale', subtitle: 'Limited Time', icon: Zap },
  { title: 'New Arrivals', subtitle: 'Just Dropped', icon: Sparkles },
  { title: 'Top Brands', subtitle: 'Curated', icon: TrendingUp },
];

const trustTiles = [
  { title: 'Free Delivery', subtitle: 'On orders ₹499+', icon: Truck },
  { title: '100% Authentic', subtitle: 'Verified brands', icon: ShieldCheck },
  { title: 'Best Prices', subtitle: 'Mega discounts daily', icon: Tag },
  { title: 'Easy Returns', subtitle: '7-day return policy', icon: Clock },
];

export function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(true);

  usePageMeta({
    title: 'Trendora | Streetwear, Fashion & Deals',
    description: 'Trendora is a fashion ecommerce storefront for streetwear, footwear, and accessories with fast checkout and live inventory.',
  });

  useEffect(() => {
    Promise.all([
      apiFetch<Product[]>('/api/products'),
      apiFetch<HomeBanner[]>('/api/banners').catch(() => []),
    ])
      .then(([productData, bannerData]) => {
        setProducts(productData);
        setBanners(bannerData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load homepage data', err);
        setLoading(false);
      });
  }, []);

  const heroBanner = banners.find((banner) => banner.placement === 'homepage') || {
    title: 'FLAT 50% OFF',
    subtitle: 'END OF SEASON',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1200',
    link: '/categories?category=Streetwear',
  };

  const handleAiStylistClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    navigate('/ai-stylist');
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#55205f]">
      <div className="w-full px-3 py-4 sm:px-4">
        <div className="relative h-[300px] w-full cursor-pointer overflow-hidden rounded-2xl bg-black p-6 shadow-sm md:h-[380px]" onClick={() => navigate(heroBanner.link)}>
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-fuchsia-950/80 via-fuchsia-800/40 to-pink-600/20"></div>

          <img
            src={assetUrl(heroBanner.image)}
            alt={heroBanner.title}
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />

          <div className="relative z-20 flex h-full max-w-[72%] flex-col justify-center text-white sm:max-w-[55%]">
            <span className="mb-3 w-max rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] backdrop-blur">
              {heroBanner.subtitle}
            </span>

            <h2 className="text-3xl font-black leading-[0.98] md:text-5xl">
              {heroBanner.title}
            </h2>
            <p className="mt-3 text-sm font-semibold text-white/85">Up to 70% OFF on 10,000+ styles</p>

            <button className="mt-5 w-max rounded-full bg-white px-5 py-3 text-xs font-black text-[#55205f] shadow-lg">
              Shop Now
            </button>
          </div>
          <div className="absolute bottom-4 left-1/2 z-20 h-1 w-12 -translate-x-1/2 rounded-full bg-white/80" />
        </div>
      </div>

      <div className="px-3 py-2 sm:px-4">
        <h3 className="mb-4 text-sm font-black tracking-tight">
          Shop by Category <span className="text-xs font-bold text-pink-500">· Top Picks</span>
        </h3>

        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/categories?category=${encodeURIComponent(cat.name)}`)}
              className="flex min-w-[72px] cursor-pointer flex-col items-center gap-2"
            >
              <div className="h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-pink-100 bg-white p-[3px] shadow-[0_6px_20px_rgba(217,70,159,0.16)]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>

              <span className="text-center text-[10px] font-bold text-[#55205f]">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-3 py-4 sm:px-4 lg:grid-cols-4">
        {quickTiles.map((tile) => (
          <button key={tile.title} className="flex items-center gap-3 rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50 to-fuchsia-50 p-3 text-left shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-pink-600 shadow-sm">
              <tile.icon size={18} />
            </span>
            <span>
              <span className="block text-sm font-black">{tile.title}</span>
              <span className="text-xs font-semibold text-fuchsia-400">{tile.subtitle}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="px-3 py-3 sm:px-4">
        <div className="relative min-h-[190px] overflow-hidden rounded-2xl bg-fuchsia-800 p-5 text-white">
          <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200" alt="AI stylist fashion" className="absolute inset-0 h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-950/80 to-pink-500/45" />
          <div className="relative z-10 max-w-md">
            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest">AI Powered</span>
            <h3 className="mt-4 text-2xl font-black leading-tight">Discover styles made for you.</h3>
            <p className="mt-2 text-sm font-medium text-white/85">Our AI stylist learns your taste and curates the perfect pieces.</p>
            <button type="button" onClick={handleAiStylistClick} className="mt-5 rounded-full bg-white px-5 py-3 text-xs font-black text-[#55205f]">Try AI Stylist</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-3 py-4 sm:px-4 lg:grid-cols-4">
        {trustTiles.map((tile) => (
          <div key={tile.title} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <tile.icon size={18} />
            </span>
            <span>
              <span className="block text-sm font-black">{tile.title}</span>
              <span className="text-xs font-semibold text-gray-400">{tile.subtitle}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 bg-white px-3 py-6 sm:px-4">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-black tracking-tight">
            Trending Now
          </h3>

          <button onClick={() => navigate('/categories?category=Streetwear')} className="text-sm font-black text-pink-600">
            View All
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex flex-col gap-2">
                <div className="bg-gray-200 aspect-[4/5] rounded-xl"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
