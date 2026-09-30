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
            <Ed as="h2" id="amenities.overview.title" className="mb-4">Modern Conveniences in Nature</Ed>
            <Ed as="p" id="amenities.overview.sub" className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">At White Rock Station, we've thoughtfully combined outdoor adventure with modern conveniences to ensure your stay is comfortable and stress-free.</Ed>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Store size={32} className="text-white" />
              </div>
              <Ed as="h4" id="amenities.card1.title" className="mb-3">Johnetta Supply</Ed>
              <Ed as="p" id="amenities.card1.desc" className="text-[var(--forest-green)]/70">Seasonal camp store with essentials, snacks, cold drinks, firewood, and White Rock merch</Ed>
            </div>

            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Wifi size={32} className="text-white" />
              </div>
              <Ed as="h4" id="amenities.card2.title" className="mb-3">WiFi Coverage</Ed>
              <Ed as="p" id="amenities.card2.desc" className="text-[var(--forest-green)]/70">Complimentary WiFi throughout the property for all guests</Ed>
            </div>

            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Fuel size={32} className="text-white" />
              </div>
              <Ed as="h4" id="amenities.card3.title" className="mb-3">Fuel Station</Ed>
              <Ed as="p" id="amenities.card3.desc" className="text-[var(--forest-green)]/70">Pay-at-pump fuel for boats and vehicles during marina hours</Ed>
            </div>

            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Flame size={32} className="text-white" />
              </div>
              <Ed as="h4" id="amenities.card4.title" className="mb-3">Firewood &amp; Ice</Ed>
              <Ed as="p" id="amenities.card4.desc" className="text-[var(--forest-green)]/70">Convenient vending machines with firewood bundles and ice</Ed>
            </div>

            <div className="bg-white border border-[var(--sand-tan)] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <Shield size={32} className="text-white" />
              </div>
              <Ed as="h4" id="amenities.card5.title" className="mb-3">Security</Ed>
              <Ed as="p" id="amenities.card5.desc" className="text-[var(--forest-green)]/70">24/7 surveillance and on-site management for your peace of mind</Ed>
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
              <Ed as="h2" id="amenities.supply.title" className="mb-6">Johnetta Supply</Ed>
              <Ed as="p" id="amenities.supply.desc" className="mb-6">Johnetta Supply is our seasonal camp store, stocked with everyday camping essentials, snacks, cold drinks, firewood, and a few things you may have forgotten at home. You'll also find White Rock Station hats, T-shirts, sweatshirts, and other merchandise to take home from your time along the Allegheny.</Ed>
              <div className="bg-[var(--sand-tan)]/30 p-6 rounded-lg mb-6">
                <Ed as="h5" id="amenities.supply.find.title" className="mb-3">What You'll Find</Ed>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <Ed as="span" id="amenities.supply.find.1">Camping essentials</Ed>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <Ed as="span" id="amenities.supply.find.2">Snacks &amp; cold drinks</Ed>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <Ed as="span" id="amenities.supply.find.3">Firewood</Ed>
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <Ed as="span" id="amenities.supply.find.4">Hats, tees &amp; sweatshirts</Ed>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <Ed as="span" id="amenities.supply.find.5">Mugs &amp; drinkware</Ed>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[var(--river-blue)] mr-2">•</span>
                      <Ed as="span" id="amenities.supply.find.6">White Rock merch</Ed>
                    </li>
                  </ul>
                </div>
              </div>
              <Ed as="p" id="amenities.supply.hours" className="text-sm text-[var(--forest-green)]/70 mb-6">Seasonal store hours vary. Select White Rock Station apparel and merchandise is also available to purchase online.</Ed>
              <CTAButton onClick={() => onNavigate('store')} className="h-11 px-7">
                <Ed as="span" id="amenities.supply.cta">Visit the Store</Ed>
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
            <Ed as="h2" id="amenities.wifi.title" className="mb-4">Stay Connected</Ed>
            <Ed as="p" id="amenities.wifi.sub" className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">Enjoy complimentary WiFi throughout White Rock Station. Stream, work remotely, or share your adventure on social media.</Ed>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 text-center">
              <Ed as="h5" id="amenities.wifi.card1.title" className="mb-3">Cabin WiFi</Ed>
              <Ed as="p" id="amenities.wifi.card1.desc" className="text-sm text-[var(--forest-green)]/70">High-speed internet in all cabins</Ed>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <Ed as="h5" id="amenities.wifi.card2.title" className="mb-3">Campsite Coverage</Ed>
              <Ed as="p" id="amenities.wifi.card2.desc" className="text-sm text-[var(--forest-green)]/70">WiFi access throughout the campground</Ed>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <Ed as="h5" id="amenities.wifi.card3.title" className="mb-3">Common Areas</Ed>
              <Ed as="p" id="amenities.wifi.card3.desc" className="text-sm text-[var(--forest-green)]/70">Strong signal at pavilion and marina</Ed>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Safety */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Shield size={64} className="mx-auto mb-6 text-[var(--river-blue)]" />
            <Ed as="h2" id="amenities.security.title" className="mb-4">Security &amp; Safety</Ed>
            <Ed as="p" id="amenities.security.sub" className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">Your safety and security are our top priorities. We maintain a well-monitored and safe environment for all guests.</Ed>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[var(--sand-tan)]/30 rounded-lg p-6">
              <Ed as="h4" id="amenities.security.card1.title" className="mb-4">24/7 Surveillance</Ed>
              <Ed as="p" id="amenities.security.card1.desc" className="mb-4 text-[var(--forest-green)]/70">Security cameras throughout the property provide continuous monitoring for your protection.</Ed>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <Ed as="span" id="amenities.security.card1.1">Main entrance monitoring</Ed>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <Ed as="span" id="amenities.security.card1.2">Common area coverage</Ed>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <Ed as="span" id="amenities.security.card1.3">Marina and parking lots</Ed>
                </li>
              </ul>
            </div>

            <div className="bg-[var(--sand-tan)]/30 rounded-lg p-6">
              <Ed as="h4" id="amenities.security.card2.title" className="mb-4">On-Site Management</Ed>
              <Ed as="p" id="amenities.security.card2.desc" className="mb-4 text-[var(--forest-green)]/70">Our management team lives on-site and is available to assist with any needs or emergencies.</Ed>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <Ed as="span" id="amenities.security.card2.1">Emergency contact available 24/7</Ed>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <Ed as="span" id="amenities.security.card2.2">Regular property patrols</Ed>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">•</span>
                  <Ed as="span" id="amenities.security.card2.3">Well-lit common areas</Ed>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-16 px-4 bg-[var(--forest-green)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Ed as="h2" id="amenities.cta.title" className="text-white mb-6">Ready to Experience It All?</Ed>
          <Ed as="p" id="amenities.cta.sub" className="text-xl mb-8 text-white/90">Book your stay at White Rock Station and enjoy all the amenities and conveniences we have to offer.</Ed>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton
              variant="secondary"
              onClick={() => onNavigate('cottages')}
              className="h-12 px-8"
            >
              <Ed as="span" id="amenities.cta.book">Book Now</Ed>
            </CTAButton>
            <a
              href="tel:724-882-9195"
              className="inline-flex items-center justify-center h-12 px-8 bg-white text-[var(--forest-green)] rounded-full hover:bg-[var(--sand-tan)] transition-all duration-300 hover:shadow-lg"
            >
              <Ed as="span" id="amenities.cta.call">Call: (724) 882-9195</Ed>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
