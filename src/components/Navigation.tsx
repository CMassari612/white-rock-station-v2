import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';

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
    { label: 'Home', page: 'home' },
    { label: 'Cottages', page: 'cottages' },
    { label: 'Camping', page: 'camping' },
    { label: 'Kayaks', page: 'kayak' },
    { label: 'Armstrong Trail', page: 'trail' },
    { label: 'Amenities', page: 'amenities' },
    { label: 'About & Contact', page: 'contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
                {item.label}
              </button>
            ))}
            <Button
              onClick={() => onNavigate('cottages')}
              className="bg-[var(--river-blue)] hover:bg-[var(--river-blue)]/90 text-white rounded-full px-6"
            >
              Book Now
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
                  {item.label}
                </button>
              ))}
              <Button
                onClick={() => {
                  onNavigate('lodging');
                  setIsMobileMenuOpen(false);
                }}
                className="bg-[var(--river-blue)] hover:bg-[var(--river-blue)]/90 text-white rounded-full w-full"
              >
                Book Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
