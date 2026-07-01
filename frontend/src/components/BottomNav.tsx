import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Categories', path: '/categories' },
  { icon: Heart, label: 'Wishlist', path: '/wishlist' },
  { icon: ShoppingBag, label: 'Cart', path: '/cart', showBadge: true },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const cartItemsCount = useStore((state) => state.cartTotalHours());

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-pink-100 bg-white pb-2 pb-safe shadow-[0_-8px_30px_rgba(217,70,159,0.08)] lg:bottom-auto lg:top-0 lg:pb-0">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-around px-2 sm:px-6 lg:justify-center lg:gap-10">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors",
                isActive ? "text-pink-600" : "text-fuchsia-300 hover:text-[#55205f]"
              )}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.showBadge && cartItemsCount > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium", isActive ? "font-bold" : "")}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-[17px] h-[3px] w-8 rounded-b-md bg-pink-600 lg:-bottom-[17px] lg:top-auto lg:rounded-b-none lg:rounded-t-md"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
