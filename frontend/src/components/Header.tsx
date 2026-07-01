import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Heart, LayoutGrid, LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartItemsCount = useStore((state) => state.cartTotalHours());
  const authToken = useStore((state) => state.authToken);
  const clearAuthSession = useStore((state) => state.clearAuthSession);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    clearAuthSession();
    localStorage.removeItem('trendora-admin-token');
    closeMenu();
    navigate('/', { replace: true });
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutGrid, label: 'Categories', path: '/categories' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: ShoppingBag, label: 'Cart', path: '/cart', showBadge: true },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 pt-3">
          <button
            className="rounded-full p-2 text-[#55205f] hover:bg-pink-50"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-700 to-pink-500 text-sm font-black text-white">
              T
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight text-[#55205f]">Trendora</p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Fashion Store</p>
            </div>
          </Link>
        </div>
        <Link
          to="/search"
          className="mx-4 my-3 flex h-11 items-center gap-2 rounded-full bg-fuchsia-50/80 px-4 text-sm font-semibold text-fuchsia-300 ring-1 ring-pink-100"
        >
          <Search size={17} />
          <span className="flex-1 truncate">Search products, brands...</span>
        </Link>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-50 transition-opacity duration-200',
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={closeMenu}
          className="absolute inset-0 bg-black/45"
        />

        <aside
          className={cn(
            'absolute left-0 top-0 flex h-full w-[86vw] max-w-sm flex-col bg-white shadow-[12px_0_40px_rgba(0,0,0,0.14)] transition-transform duration-200',
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <Link to="/" onClick={closeMenu} className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-700 to-pink-500 text-sm font-black text-white">
                T
              </span>
              <div>
                <p className="text-sm font-black text-[#55205f]">Trendora</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Menu</p>
              </div>
            </Link>
            <button onClick={closeMenu} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <div className="border-b border-gray-100 px-4 py-4">
            <Link
              to="/search"
              onClick={closeMenu}
              className="flex h-11 items-center gap-2 rounded-full bg-gray-50 px-4 text-sm font-semibold text-gray-500 ring-1 ring-gray-100"
            >
              <Search size={16} />
              Search products, brands...
            </Link>
          </div>

          <nav className="flex-1 px-3 py-3">
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    className={cn(
                      'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
                      isActive ? 'bg-black text-white' : 'bg-white text-[#55205f] hover:bg-pink-50'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={18} />
                      {item.label}
                    </span>
                    {item.showBadge && cartItemsCount > 0 && (
                      <span
                        className={cn(
                          'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black',
                          isActive ? 'bg-white text-black' : 'bg-pink-600 text-white'
                        )}
                      >
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-gray-100 p-4">
            {authToken ? (
              <button
                onClick={handleLogout}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 text-sm font-black text-red-600"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex h-12 items-center justify-center rounded-full bg-black text-sm font-black text-white"
                >
                  Login
                </Link>
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className="flex h-12 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-black text-gray-900"
                >
                  Admin
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
