import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Menu, X, User, ShoppingBag, LogIn, UserPlus, ChevronRight } from 'lucide-react';
import { useSettings } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const navLinkClass =
  'relative px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group';

const NavUnderline = () => (
  <motion.span
    layoutId="nav-underline"
    className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full"
    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
  />
);

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const { data: settings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const brandName = settings?.brand_name || 'Kronos';
  const logoUrl = (settings as any)?.logo_url;

  const handleMyOrders = () => {
    setMenuOpen(false);
    if (user) {
      navigate('/my-orders');
    } else {
      navigate('/login');
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 bg-white backdrop-blur-2xl border-b border-border/40 shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Menu toggle (mobile) + Nav links (desktop) */}
        <div className="flex items-center gap-1">
          {/* Mobile Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <AnimatePresence mode="wait">
              {menuOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={navLinkClass}
              onMouseEnter={() => setHoveredLink('home')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              হোম
              {hoveredLink === 'home' && <NavUnderline />}
            </Link>
            <Link
              to="/track"
              className={`${navLinkClass} flex items-center gap-1.5`}
              onMouseEnter={() => setHoveredLink('track')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <Package className="h-3.5 w-3.5" />
              অর্ডার ট্র্যাকিং
              {hoveredLink === 'track' && <NavUnderline />}
            </Link>
            <button
              onClick={handleMyOrders}
              className={`${navLinkClass} flex items-center gap-1.5`}
              onMouseEnter={() => setHoveredLink('orders')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              মাই অর্ডার
              {hoveredLink === 'orders' && <NavUnderline />}
            </button>
          </div>
        </div>

        {/* Center: Logo/Brand */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 group">
          {logoUrl ? (
            <>
              <motion.img
                src={logoUrl}
                alt={brandName}
                className="h-9 w-auto object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
              <span className="text-base font-bold text-foreground tracking-tight group-hover:text-accent transition-colors duration-200">
                {brandName}
              </span>
            </>
          ) : (
            <>
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.5 }}
                className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"
              >
                <span className="text-accent-foreground font-bold text-sm">
                  {brandName.charAt(0)}
                </span>
              </motion.div>
              <span className="text-base font-bold text-foreground tracking-tight group-hover:text-accent transition-colors duration-200">
                {brandName}
              </span>
            </>
          )}
        </Link>

        {/* Right: Auth */}
        <div className="hidden md:flex items-center">
          {!user ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              <LogIn className="h-3.5 w-3.5" />
              লগইন
            </Link>
          ) : (
            <Link
              to="/my-orders"
              className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent hover:bg-accent/25 transition-colors"
            >
              <User className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Mobile: Auth icon */}
        <div className="md:hidden">
          {!user ? (
            <Link to="/login" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <LogIn className="h-5 w-5 text-muted-foreground" />
            </Link>
          ) : (
            <Link to="/my-orders" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <User className="h-5 w-5 text-accent" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-border/40 bg-card"
          >
            <div className="px-4 py-3 space-y-1">
              {[
                { to: '/', label: 'হোম', icon: null },
                { to: '/track', label: 'অর্ডার ট্র্যাকিং', icon: <Package className="h-4 w-4" /> },
              ].map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      {item.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <button
                  onClick={handleMyOrders}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag className="h-4 w-4" />
                    মাই অর্ডার
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </motion.div>

              {/* Auth section */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="pt-3 mt-2 border-t border-border/40"
              >
                {!user ? (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                    >
                      <LogIn className="h-4 w-4" />
                      লগইন করুন
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      অ্যাকাউন্ট করুন
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
