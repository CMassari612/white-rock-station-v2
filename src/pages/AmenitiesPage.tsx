import { Store, Fuel, Shield, Wifi, Flame } from 'lucide-react';
import { CTAButton } from '../components/CTAButton';
import { Ed } from '../lib/siteText';

interface AmenitiesPageProps {
  onNavigate: (page: string) => void;
}

export function AmenitiesPage({ onNavigate }: AmenitiesPageProps) {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative h-96 flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/scenery/Scenery%2018.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <Ed as="h1" id="amenities.hero.title" className="text-white mb-4">Amenities & Services</Ed>
          <Ed as="p" id="amenities.hero.sub" className="text-xl text-white/90">Everything You Need for a Perfect Stay</Ed>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">Modern Conveniences in Nature</h2>
            <p className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">
              At White Rock Station, we've thoughtfully combined outdoor adventure with modern 
              conveniences to ensure your stay is comfortable and stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Store size={32} className="text-white" />
              </div>
              <h4 className="mb-3">Johnetta Supply</h4>
              <p className="text-[var(--forest-green)]/70">
                Seasonal camp store with essentials, snacks, cold drinks, firewood, and White Rock merch
              </p>
            </div>

            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Wifi size={32} className="text-white" />
              </div>
              <h4 className="mb-3">WiFi Coverage</h4>
              <p className="text-[var(--forest-green)]/70">
                Complimentary WiFi throughout the property for all guests
              </p>
            </div>

            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Fuel size={32} className="text-white" />
              </div>
              <h4 className="mb-3">Fuel Station</h4>
              <p className="text-[var(--forest-green)]/70">
                Pay-at-pump fuel for boats and vehicles during marina hours
              </p>
            </div>

            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Flame size={32} className="text-white" />
              </div>
              <h4 className="mb-3">Firewood & Ice</h4>
              <p className="text-[var(--forest-green)]/70">
                Convenient vending machines with firewood bundles and ice
              </p>
            </div>

            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Shield size={32} className="text-white" />
              </div>
              <h4 className="mb-3">Security</h4>
              <p className="text-[var(--forest-green)]/70">
                24/7 surveillance and on-site management for your peace of mind
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Johnetta Supply */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-lg overflow-hidden shadow-xl">
              <img
                src="/images/store/store-10.jpg"
                alt="Johnetta Supply camp store at White Rock Station"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="mb-6">Johnetta Supply</h2>
              <p className="mb-6">
                Johnetta Supply is our seasonal camp store, stocked with everyday camping essentials,
                snacks, cold drinks, firewood, and a few things you may have forgotten at home. You'll
                also find White Rock Station hats, T-shirts, sweatshirts, and other merchandise to take
                home from your time along the Allegheny.
              </p>
              <div className="bg-[var(--sand-tan)]/30 p-6 rounded-lg mb-6">
                <h5 className="mb-3">What You'll Find</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <span>Camping essentials</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <span>Snacks & cold drinks</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <span>Firewood</span>
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <span>Hats, tees & sweatshirts</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <span>Mugs & drinkware</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <span>White Rock merch</span>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-[var(--forest-green)]/70 mb-6">
                Seasonal store hours vary. Select White Rock Station apparel and merchandise is also
                available to purchase online.
              </p>
              <CTAButton onClick={() => onNavigate('store')} className="h-11 px-7">
                Visit the Store
              </CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* WiFi Coverage */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Wifi size={64} className="mx-auto mb-6 text-[var(--river-blue)]" />
            <h2 className="mb-4">Stay Connected</h2>
            <p className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">
              Enjoy complimentary WiFi throughout White Rock Station. Stream, work remotely, or 
              share your adventure on social media.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 text-center">
              <h5 className="mb-3">Cabin WiFi</h5>
              <p className="text-sm text-[var(--forest-green)]/70">
                High-speed internet in all cabins
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <h5 className="mb-3">Campsite Coverage</h5>
              <p className="text-sm text-[var(--forest-green)]/70">
                WiFi access throughout the campground
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <h5 className="mb-3">Common Areas</h5>
              <p className="text-sm text-[var(--forest-green)]/70">
                Strong signal at pavilion and marina
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Safety */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Shield size={64} className="mx-auto mb-6 text-[var(--river-blue)]" />
            <h2 className="mb-4">Security & Safety</h2>
            <p className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">
              Your safety and security are our top priorities. We maintain a well-monitored 
              and safe environment for all guests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[var(--sand-tan)]/30 rounded-lg p-6">
              <h4 className="mb-4">24/7 Surveillance</h4>
              <p className="mb-4 text-[var(--forest-green)]/70">
                Security cameras throughout the property provide continuous monitoring for your protection.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <span>Main entrance monitoring</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <span>Common area coverage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <span>Marina and parking lots</span>
                </li>
              </ul>
            </div>

            <div className="bg-[var(--sand-tan)]/30 rounded-lg p-6">
              <h4 className="mb-4">On-Site Management</h4>
              <p className="mb-4 text-[var(--forest-green)]/70">
                Our management team lives on-site and is available to assist with any needs or emergencies.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <span>Emergency contact available 24/7</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <span>Regular property patrols</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <span>Well-lit common areas</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-16 px-4 bg-[var(--forest-green)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-white mb-6">Ready to Experience It All?</h2>
          <p className="text-xl mb-8 text-white/90">
            Book your stay at White Rock Station and enjoy all the amenities and conveniences 
            we have to offer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton
              variant="secondary"
              onClick={() => onNavigate('cottages')}
              className="h-12 px-8"
            >
              Book Now
            </CTAButton>
            <a
              href="tel:724-882-9195"
              className="inline-flex items-center justify-center h-12 px-8 bg-white text-[var(--forest-green)] rounded-full hover:bg-[var(--sand-tan)] transition-all duration-300 hover:shadow-lg"
            >
              Call: (724) 882-9195
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
