import { useEffect } from 'react';
import { Wifi, Armchair, Bed, Flame, Users, Dog, DollarSign } from 'lucide-react';
import { CTAButton } from '../components/CTAButton';
import { PhotoGallery } from '../components/PhotoGallery';
import { cabinGalleryImages, campsiteGalleryImages } from '../lib/galleryImages';

interface LodgingPageProps {
  onNavigate: (page: string, lodgingType?: string) => void;
}

export function LodgingPage({ onNavigate }: LodgingPageProps) {
  useEffect(() => {
    if (window.location.hash !== '#campsites') return;
    // Allow the DOM to paint before scrolling.
    const id = window.setTimeout(() => {
      const el = document.getElementById('campsites');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative h-96 flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/cabins/Cabins%2003.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-white mb-4">Lodging Options</h1>
          <p className="text-xl text-white/90">Cabins & Campsites for Every Adventure</p>
        </div>
      </section>

      {/* Cabins Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center mb-4">Cozy Cabins</h2>
          <p className="text-center max-w-2xl mx-auto mb-12">
            Enjoy the comfort of modern amenities in a rustic riverside setting. Perfect for couples, 
            families, and groups looking for a memorable outdoor escape.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Small Cabins */}
            <div className="bg-[var(--sand-tan)]/20 rounded-lg overflow-hidden shadow-lg">
              <div className="aspect-video overflow-hidden">
                <img 
                  src="/images/cabins/Cabins%2015.jpg"
                  alt="Small Cabin"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="mb-2">Small Cabins</h3>
                    <p className="flex items-center text-[var(--forest-green)]/70">
                      <Users size={18} className="mr-2" />
                      Sleeps 2 people
                    </p>
                  </div>
                  <div className="bg-[var(--river-blue)] text-white px-4 py-2 rounded-lg">
                    <div>$125</div>
                    <div className="text-sm">/night</div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="mb-3">8 Available Cabins</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <Wifi size={16} className="mr-2 text-[var(--river-blue)]" />
                      WiFi
                    </div>
                    <div className="flex items-center">
                      <Armchair size={16} className="mr-2 text-[var(--river-blue)]" />
                      Seating Area
                    </div>
                    <div className="flex items-center">
                      <Bed size={16} className="mr-2 text-[var(--river-blue)]" />
                      Linens
                    </div>
                    <div className="flex items-center">
                      <Flame size={16} className="mr-2 text-[var(--river-blue)]" />
                      Fire Ring
                    </div>
                  </div>
                </div>

                <CTAButton onClick={() => onNavigate('cabin-select', 'small-cabin' as any)} className="w-full justify-center">
                  Book Small Cabin
                </CTAButton>
              </div>
            </div>

            {/* Large Cabins */}
            <div className="bg-[var(--sand-tan)]/20 rounded-lg overflow-hidden shadow-lg">
              <div className="aspect-video overflow-hidden">
                <img 
                  src="/images/cabins/Cabins%2016.jpg"
                  alt="Large Cabin"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="mb-2">Large Cabins</h3>
                    <p className="flex items-center text-[var(--forest-green)]/70">
                      <Users size={18} className="mr-2" />
                      Sleeps 4 people
                    </p>
                  </div>
                  <div className="bg-[var(--river-blue)] text-white px-4 py-2 rounded-lg">
                    <div>$250</div>
                    <div className="text-sm">/night</div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="mb-3">4 Available Cabins</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <Wifi size={16} className="mr-2 text-[var(--river-blue)]" />
                      WiFi
                    </div>
                    <div className="flex items-center">
                      <Armchair size={16} className="mr-2 text-[var(--river-blue)]" />
                      Seating Area
                    </div>
                    <div className="flex items-center">
                      <Bed size={16} className="mr-2 text-[var(--river-blue)]" />
                      Linens
                    </div>
                    <div className="flex items-center">
                      <Flame size={16} className="mr-2 text-[var(--river-blue)]" />
                      Fire Ring
                    </div>
                  </div>
                </div>

                <CTAButton onClick={() => onNavigate('cabin-select', 'large-cabin' as any)} className="w-full justify-center">
                  Book Large Cabin
                </CTAButton>
              </div>
            </div>
          </div>

          {/* Cabin Gallery */}
          <div className="mb-6">
            <h4 className="mb-4 text-center">Cabin Gallery</h4>
            <PhotoGallery images={cabinGalleryImages} onOpen={() => onNavigate('cabin-gallery')} />
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <CTAButton onClick={() => onNavigate('cabin-gallery')}>View Full Cabin Gallery</CTAButton>
            </div>
          </div>

          {/* Cabin Amenities */}
          <div className="bg-[var(--forest-green)] text-white rounded-lg p-8">
            <h4 className="text-white mb-6 text-center">All Cabins Include</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32 }}>
              <div className="text-center" style={{ width: 110 }}>
                <Wifi size={32} className="mx-auto mb-2" />
                <p className="text-sm">WiFi</p>
              </div>
              <div className="text-center" style={{ width: 110 }}>
                <Bed size={32} className="mx-auto mb-2" />
                <p className="text-sm">Linens</p>
              </div>
              <div className="text-center" style={{ width: 110 }}>
                <Flame size={32} className="mx-auto mb-2" />
                <p className="text-sm">Fire Ring</p>
              </div>
              <div className="text-center" style={{ width: 110 }}>
                <Armchair size={32} className="mx-auto mb-2" />
                <p className="text-sm">Seating Area</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campsites Section */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <h2 id="campsites" className="text-center mb-4 scroll-mt-24">Campsites</h2>
          <p className="text-center max-w-2xl mx-auto mb-12">
            40 full-hookup sites perfect for RVs and tent camping. Enjoy the great outdoors with 
            modern conveniences at your fingertips.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Nightly Rates */}
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <div className="text-[var(--river-blue)] mb-4">Nightly Rates</div>
              <div className="mb-4">
                <div className="text-[var(--forest-green)] mb-2">Starting at</div>
                <div className="flex items-center justify-center">
                  <DollarSign size={24} className="text-[var(--river-blue)]" />
                  <span className="text-[var(--river-blue)]">45</span>
                  <span className="text-[var(--forest-green)]/70">/night</span>
                </div>
              </div>
              <p className="text-sm text-[var(--forest-green)]/70">Full hookups included</p>
            </div>

            {/* Weekly Rates */}
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <div className="text-[var(--river-blue)] mb-4">Weekly Rates</div>
              <div className="mb-4">
                <div className="text-[var(--forest-green)] mb-2">Starting at</div>
                <div className="flex items-center justify-center">
                  <DollarSign size={24} className="text-[var(--river-blue)]" />
                  <span className="text-[var(--river-blue)]">280</span>
                  <span className="text-[var(--forest-green)]/70">/week</span>
                </div>
              </div>
              <p className="text-sm text-[var(--forest-green)]/70">Save with weekly stays</p>
            </div>

            {/* Seasonal Sites */}
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <div className="text-[var(--river-blue)] mb-4">Seasonal Sites</div>
              <div className="mb-4">
                <div className="text-[var(--forest-green)] mb-2">April - October</div>
                <div className="text-[var(--forest-green)]">Contact for availability</div>
              </div>
              <CTAButton onClick={() => onNavigate('contact')} className="w-full justify-center" variant="secondary">
                Join Waitlist
              </CTAButton>
            </div>
          </div>

          {/* Campsite Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h4 className="mb-4">Campsite Features</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <span>Full hookups: water, electric (30/50 amp), and sewer</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <span>RV pull-through sites available</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <span>Level gravel pads</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <span>Picnic tables and fire rings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <span>WiFi coverage throughout property</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h4 className="mb-4">Campground Areas</h4>
              <div className="space-y-4">
                <div className="bg-[var(--sand-tan)]/30 p-4 rounded-lg">
                  <h5 className="text-[var(--forest-green)] mb-2">400s Section</h5>
                  <p className="text-sm">Riverfront sites with beautiful water views. Premium location for water enthusiasts.</p>
                </div>
                <div className="bg-[var(--sand-tan)]/30 p-4 rounded-lg">
                  <h5 className="text-[var(--forest-green)] mb-2">500s Section</h5>
                  <p className="text-sm">Wooded sites offering shade and privacy. Perfect for those seeking a quiet retreat.</p>
                </div>
                <div className="flex items-center text-[var(--warm-brown)] mt-4">
                  <Dog size={20} className="mr-2" />
                  <span>Pet-friendly sites available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campsite Gallery */}
          <div>
            <h4 className="mb-6 text-center">Campsite Gallery</h4>
            <PhotoGallery images={campsiteGalleryImages} onOpen={() => onNavigate('campsite-gallery')} />
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <CTAButton onClick={() => onNavigate('campsite-gallery')}>View Full Campsite Gallery</CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-16 px-4 bg-[var(--forest-green)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-white mb-6">Ready to Book Your Stay?</h2>
          <p className="text-xl mb-8 text-white/90">
            Contact us today to reserve your cabin or campsite. We look forward to hosting you!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton
              variant="secondary"
              onClick={() => onNavigate('contact')}
              className="h-12 px-8"
            >
              Contact Us
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
