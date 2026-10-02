import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Ed } from '../lib/siteText';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', page: 'home', id: 'nav.home' },
    { label: 'Cottages', page: 'cottages', id: 'nav.cottages' },
    { label: 'Armstrong Trails', page: 'trail', id: 'nav.trail' },
    { label: 'Amenities', page: 'amenities', id: 'nav.amenities' },
    { label: 'Store', page: 'store', id: 'nav.store' },
    { label: 'About & Contact', page: 'contact', id: 'nav.contact' },
  ];

  return (
    <nav
      style={{ top: 0 }}
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? 'bg-[var(--forest-green)] shadow-lg'
          : 'bg-[var(--forest-green)]/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center"
            aria-label="White Rock Station — home"
          >
            <img
              src="/brand/wrs-lockup-cream.png"
              alt="White Rock Station — Riverfront Resort & Marina"
              style={{ height: 72, width: 'auto' }}
            />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`text-white hover:text-[var(--sand-tan)] transition-colors ${
                  currentPage === item.page ? 'text-[var(--sand-tan)]' : ''
                }`}
              >
                <Ed as="span" id={item.id}>{item.label}</Ed>
              </button>
            ))}
            <Button
              onClick={() => onNavigate('cottages')}
              className="bg-[var(--river-blue)] hover:bg-[var(--river-blue)]/90 text-white rounded-full px-6"
            >
              <Ed as="span" id="nav.booknow">Book Now</Ed>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-6">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-white hover:text-[var(--sand-tan)] transition-colors text-left ${
                    currentPage === item.page ? 'text-[var(--sand-tan)]' : ''
                  }`}
                >
                  <Ed as="span" id={item.id}>{item.label}</Ed>
                </button>
              ))}
              <Button
                onClick={() => {
                  onNavigate('cottages');
                  setIsMobileMenuOpen(false);
                }}
                className="bg-[var(--river-blue)] hover:bg-[var(--river-blue)]/90 text-white rounded-full w-full"
              >
                <Ed as="span" id="nav.booknow">Book Now</Ed>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
