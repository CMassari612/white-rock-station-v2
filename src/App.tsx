import { useEffect, useState } from 'react';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CottagesPage } from './pages/CottagesPage';
import { CottageDetailPage } from './pages/CottageDetailPage';
import { BookingPage } from './pages/BookingPage';
import { BookingSuccessPage } from './pages/BookingSuccessPage';
import { BookingCancelPage } from './pages/BookingCancelPage';
import { TrailPage } from './pages/TrailPage';
import { AmenitiesPage } from './pages/AmenitiesPage';
import { ContactPage } from './pages/ContactPage';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { getAdminPassword } from './lib/adminSession';

type PageType =
  | 'home' | 'cottages' | 'cottage-detail'
  | 'booking' | 'booking-success' | 'booking-cancel'
  | 'trail' | 'amenities' | 'contact'
  | 'admin-login' | 'admin';

const PATHS: Record<PageType, string> = {
  home: '/', cottages: '/cottages', 'cottage-detail': '/cottages',
  booking: '/book', 'booking-success': '/booking/success', 'booking-cancel': '/booking/cancel',
  trail: '/trail', amenities: '/amenities', contact: '/contact',
  'admin-login': '/admin/login', admin: '/admin',
};

const ADMIN_PAGES: PageType[] = ['admin'];

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [slug, setSlug] = useState<string | undefined>(undefined);

  function resolveFromUrl() {
    const path = window.location.pathname;
    if (path.startsWith('/admin/login')) return setCurrentPage('admin-login');
    if (path.startsWith('/admin')) return setCurrentPage('admin');
    if (path.startsWith('/booking/success')) return setCurrentPage('booking-success');
    if (path.startsWith('/booking/cancel')) return setCurrentPage('booking-cancel');
    if (path.startsWith('/book')) return setCurrentPage('booking');
    if (path.startsWith('/cottages/')) { setSlug(decodeURIComponent(path.split('/cottages/')[1] || '')); return setCurrentPage('cottage-detail'); }
    if (path.startsWith('/cottages')) return setCurrentPage('cottages');
    if (path.startsWith('/trail')) return setCurrentPage('trail');
    if (path.startsWith('/amenities')) return setCurrentPage('amenities');
    if (path.startsWith('/contact')) return setCurrentPage('contact');
    setCurrentPage('home');
  }

  useEffect(() => {
    resolveFromUrl();
    window.addEventListener('popstate', resolveFromUrl);
    return () => window.removeEventListener('popstate', resolveFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigate = (page: string, nextSlug?: string) => {
    const p = page as PageType;
    setCurrentPage(p);
    setSlug(nextSlug);
    const nextPath = p === 'cottage-detail' && nextSlug ? `/cottages/${encodeURIComponent(nextSlug)}` : (PATHS[p] ?? '/');
    window.history.pushState({}, '', nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminArea = currentPage === 'admin-login' || ADMIN_PAGES.includes(currentPage);

  const renderPage = () => {
    // Admin auth guard
    if (ADMIN_PAGES.includes(currentPage) && !getAdminPassword()) {
      return <AdminLogin onNavigate={handleNavigate} />;
    }
    switch (currentPage) {
      case 'home': return <HomePage onNavigate={handleNavigate} />;
      case 'cottages': return <CottagesPage onNavigate={handleNavigate} />;
      case 'cottage-detail': return <CottageDetailPage slug={slug} onNavigate={handleNavigate} />;
      case 'booking': return <BookingPage onNavigate={handleNavigate} />;
      case 'booking-success': return <BookingSuccessPage onNavigate={handleNavigate} />;
      case 'booking-cancel': return <BookingCancelPage onNavigate={handleNavigate} />;
      case 'trail': return <TrailPage onNavigate={handleNavigate} />;
      case 'amenities': return <AmenitiesPage onNavigate={handleNavigate} />;
      case 'contact': return <ContactPage onNavigate={handleNavigate} />;
      case 'admin-login': return <AdminLogin onNavigate={handleNavigate} />;
      case 'admin': return <AdminDashboard onNavigate={handleNavigate} />;
      default: return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {!isAdminArea && <Navigation currentPage={currentPage} onNavigate={handleNavigate} />}
      <main className="flex-grow overflow-x-hidden">{renderPage()}</main>
      {!isAdminArea && <Footer onNavigate={handleNavigate} />}
    </div>
  );
}
