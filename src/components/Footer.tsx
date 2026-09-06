import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';

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
            <p className="text-[var(--sand-tan)] text-sm tracking-wide mb-4">Riverfront Resort &amp; Marina</p>
            <p className="text-white/80 text-sm leading-relaxed">
              Riverfront cottages, primitive camping, and river access along the Armstrong Trail. Your riverside escape awaits.
            </p>
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
            <h5 className="text-[var(--sand-tan)] mb-4">Quick Links</h5>
            <div className="flex flex-col space-y-2">
              <button onClick={() => onNavigate('home')} className="text-white/80 hover:text-white text-left text-sm">
                Home
              </button>
              <button onClick={() => onNavigate('cottages')} className="text-white/80 hover:text-white text-left text-sm">
                Cottages
              </button>
              <button onClick={() => onNavigate('camping')} className="text-white/80 hover:text-white text-left text-sm">
                Camping
              </button>
              <button onClick={() => onNavigate('trail')} className="text-white/80 hover:text-white text-left text-sm">
                Armstrong Trail
              </button>
              <button onClick={() => onNavigate('amenities')} className="text-white/80 hover:text-white text-left text-sm">
                Amenities
              </button>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-[var(--sand-tan)] mb-4">Contact</h5>
            <div className="flex flex-col space-y-3">
              <div className="flex items-start space-x-2 text-sm">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span className="text-white/80">395 Silvis Hollow Rd, Kittanning, PA 16201</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone size={16} className="flex-shrink-0" />
                <span className="text-white/80">(724) 882-9195</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail size={16} className="flex-shrink-0" />
                <span className="text-white/80">info@whiterockstation.com</span>
              </div>
            </div>
          </div>

          {/* Social & Hours */}
          <div>
            <h5 className="text-[var(--sand-tan)] mb-4">Connect With Us</h5>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
            <div className="text-sm text-white/80">
              <p>Cabins &amp; Campsites: Open Year-Round</p>
              <p className="mt-1">Marina: Weather dependent</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-white/60 text-sm">
            © 2026 White Rock Station. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <button className="text-white/60 hover:text-white">Privacy Policy</button>
            <button className="text-white/60 hover:text-white">Terms of Service</button>
            <button className="text-white/60 hover:text-white">Cancellation Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
