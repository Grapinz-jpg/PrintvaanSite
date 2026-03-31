import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, LogIn, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser, login, logout } from '../services/db';
import { User as UserType } from '../types';

interface NavbarProps {
  cartCount: number;
}

export default function Navbar({ cartCount }: NavbarProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const handleAuth = async () => {
    if (user) {
      await logout();
      setUser(null);
    } else {
      const loggedInUser = await login();
      setUser(loggedInUser);
    }
  };

  const navLinks = [
    { name: 'Normal Flex', href: '/#products' },
    { name: 'Star Flex', href: '/#products' },
    { name: 'Back Light', href: '/#products' },
    { name: 'Vinyl', href: '/#products' },
    { name: 'Sun Pack Printing', href: '/#products' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-extrabold text-brand-orange tracking-tighter">PrintVaan</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-brand-navy/70 hover:text-brand-orange px-2 py-2 text-sm font-semibold transition-colors uppercase tracking-tight"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-5">
            <Link to="/orders" className="p-2 text-brand-navy/70 hover:text-brand-orange transition-colors relative group">
              <Package className="h-6 w-6" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-brand-navy text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">My Orders</span>
            </Link>

            <Link to="/cart" className="relative cursor-pointer group p-2">
              <ShoppingCart className="h-6 w-6 text-brand-navy group-hover:text-brand-orange transition-colors" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-brand-orange rounded-full min-w-[18px]">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleAuth}
              className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 text-brand-navy px-4 py-2 rounded-full border border-gray-200 transition-all"
            >
              {user ? (
                <>
                  <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full" />
                  <span className="text-sm font-bold">{user.name}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span className="text-sm font-bold">Login</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-brand-navy" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-brand-orange rounded-full min-w-[18px]">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-brand-navy hover:text-brand-orange"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block px-3 py-3 text-base font-bold text-brand-navy/70 hover:text-brand-orange hover:bg-gray-50 rounded-xl transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Link
                to="/orders"
                className="block px-3 py-3 text-base font-bold text-brand-navy/70 hover:text-brand-orange hover:bg-gray-50 rounded-xl transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                My Orders
              </Link>
              <div className="pt-4">
                <button
                  onClick={handleAuth}
                  className="w-full text-left px-4 py-4 text-base font-bold text-brand-navy bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center space-x-3">
                    {user ? (
                      <>
                        <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                        <span>{user.name}</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        <span>Login</span>
                      </>
                    )}
                  </div>
                  {user && <span className="text-xs text-gray-400 font-medium">Logout</span>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
