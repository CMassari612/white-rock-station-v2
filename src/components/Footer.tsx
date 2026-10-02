import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';
import { Ed } from '../lib/siteText';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[var(--forest-green)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <img
              src="/brand/wrs-lockup-cream.png"
              alt="White Rock Station — Riverfront Resort & Marina"
              className="h-20 w-auto mb-2"
            />
            <Ed as="p" id="footer.about.tagline" className="text-[var(--sand-tan)] text-sm tracking-wide mb-4">Riverfront Resort &amp; Marina</Ed>
            <Ed as="p" id="footer.about.blurb" className="text-white/80 text-sm leading-relaxed">Riverfront cottages and river access along the Armstrong Trails. Your riverside escape awaits.</Ed>
            {/* Hidden staff shortcut: invisible button that opens the admin login.
                Size is set via inline styles (no Tailwind compiler) so the empty
                button keeps a real, clickable hit area. */}
            <button
              type="button"
              onClick={() => onNavigate('admin-login')}
              aria-label="Staff login"
              style={{
                display: 'block',
                width: '120px',
                height: '24px',
                marginTop: '12px',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'default',
              }}
            />
          </div>

          {/* Quick Links */}
          <div>
            <Ed as="h5" id="footer.quicklinks.title" className="text-[var(--sand-tan)] mb-4">Quick Links</Ed>
            <div className="flex flex-col space-y-2">
              <button onClick={() => onNavigate('home')} className="text-white/80 hover:text-white text-left text-sm">
                <Ed as="span" id="footer.quicklinks.home">Home</Ed>
              </button>
              <button onClick={() => onNavigate('cottages')} className="text-white/80 hover:text-white text-left text-sm">
                <Ed as="span" id="footer.quicklinks.cottages">Cottages</Ed>
              </button>
              <button onClick={() => onNavigate('trail')} className="text-white/80 hover:text-white text-left text-sm">
                <Ed as="span" id="footer.quicklinks.trail">Armstrong Trails</Ed>
              </button>
              <button onClick={() => onNavigate('amenities')} className="text-white/80 hover:text-white text-left text-sm">
                <Ed as="span" id="footer.quicklinks.amenities">Amenities</Ed>
              </button>
              <button onClick={() => onNavigate('store')} className="text-white/80 hover:text-white text-left text-sm">
                <Ed as="span" id="footer.quicklinks.store">Camp Store</Ed>
              </button>
            </div>
          </div>

          {/* Contact */}
          <div>
            <Ed as="h5" id="footer.contact.title" className="text-[var(--sand-tan)] mb-4">Contact</Ed>
            <div className="flex flex-col space-y-3">
              <div className="flex items-start space-x-2 text-sm">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span className="text-white/80"><Ed as="span" id="footer.contact.address">149 Upper Allegheny Drive, Vandergrift, PA 15690</Ed><br /><Ed as="span" id="footer.contact.mailing">Mailing: PO Box 393, Leechburg, PA 15656</Ed></span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone size={16} className="flex-shrink-0" />
                <Ed as="span" id="footer.contact.phone" className="text-white/80">(724) 882-9195</Ed>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail size={16} className="flex-shrink-0" />
                <Ed as="span" id="footer.contact.email" className="text-white/80">info@whiterockstation.com</Ed>
              </div>
            </div>
          </div>

          {/* Social & Hours */}
          <div>
            <Ed as="h5" id="footer.connect.title" className="text-[var(--sand-tan)] mb-4">Connect With Us</Ed>
            <div className="flex space-x-4 mb-4">
              <a
                href="https://www.facebook.com/p/White-Rock-Station-Riverfront-Resort-Marina-61593931372842/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="White Rock Station on Facebook"
                className="text-white/80 hover:text-white transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
            <div className="text-sm text-white/80 space-y-1">
              <Ed as="p" id="footer.connect.hours.cabins">Cabins &amp; Campsites: Open seasonally, April through October</Ed>
              <Ed as="p" id="footer.connect.hours.marina">Marina: Open seasonally, April through October</Ed>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <Ed as="p" id="footer.bottom.copyright" className="text-white/60 text-sm">© 2026 White Rock Station. All rights reserved.</Ed>
          <div className="flex space-x-6 text-sm">
            <button className="text-white/60 hover:text-white" onClick={() => onNavigate('privacy')}><Ed as="span" id="footer.bottom.privacy">Privacy Policy</Ed></button>
            <button className="text-white/60 hover:text-white" onClick={() => onNavigate('terms')}><Ed as="span" id="footer.bottom.terms">Terms of Service</Ed></button>
            <button className="text-white/60 hover:text-white" onClick={() => onNavigate('cancellation')}><Ed as="span" id="footer.bottom.cancellation">Cancellation Policy</Ed></button>
          </div>
        </div>
      </div>
    </footer>
  );
}
