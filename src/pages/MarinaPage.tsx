import { Anchor, Fuel, MapPin, Calendar, DollarSign, Waves, Bird } from 'lucide-react';
import { CTAButton } from '../components/CTAButton';
import { StatCard } from '../components/StatCard';
import { SeasonSlipApplicationForm } from '../components/SeasonSlipApplicationForm';
import { RiverMap } from '../components/RiverMap';

interface MarinaPageProps {
  onNavigate: (page: string) => void;
}

export function MarinaPage({ onNavigate }: MarinaPageProps) {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative h-96 flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/scenery/Scenery%2033.jpeg')`,
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-white mb-4">Marina & Riverfront</h1>
          <p className="text-xl text-white/90">Your Gateway to the Allegheny River</p>
        </div>
      </section>

      {/* Marina Overview */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">20-Boat Slip Marina</h2>
            <p className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">
              Open weather permitting, our full-service marina provides premium, weather-dependent
              access to the beautiful Allegheny River for boating, fishing, and water recreation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard
              value="20"
              label="Boat Slips Available"
              icon={<Anchor size={32} className="text-[var(--river-blue)]" />}
            />
            <StatCard
              value="$35/ft"
              label="Slip Pricing"
              icon={<DollarSign size={32} className="text-[var(--river-blue)]" />}
            />
            <StatCard
              value="Season"
              label="Weather Dependent"
              icon={<Calendar size={32} className="text-[var(--river-blue)]" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="mb-6">Marina Features</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Anchor className="mr-3 mt-1 text-[var(--river-blue)] flex-shrink-0" size={20} />
                  <div>
                    <div className="text-[var(--forest-green)] mb-1">Premium Boat Slips</div>
                    <p className="text-sm text-[var(--forest-green)]/70">
                      20 well-maintained slips priced at $35 per foot. Accommodates various boat sizes.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Fuel className="mr-3 mt-1 text-[var(--river-blue)] flex-shrink-0" size={20} />
                  <div>
                    <div className="text-[var(--forest-green)] mb-1">Fuel Station</div>
                    <p className="text-sm text-[var(--forest-green)]/70">
                      Convenient pay-at-pump fuel station for boats. No need to leave the marina.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Waves className="mr-3 mt-1 text-[var(--river-blue)] flex-shrink-0" size={20} />
                  <div>
                    <div className="text-[var(--forest-green)] mb-1">Easy River Access</div>
                    <p className="text-sm text-[var(--forest-green)]/70">
                      Direct access to the Allegheny River. Perfect for kayaking, canoeing, and fishing.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <MapPin className="mr-3 mt-1 text-[var(--river-blue)] flex-shrink-0" size={20} />
                  <div>
                    <div className="text-[var(--forest-green)] mb-1">Prime Location</div>
                    <p className="text-sm text-[var(--forest-green)]/70">
                      Ideally situated on the Allegheny River with access to nearby river towns.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img
                src="/images/scenery/Scenery%2010.jpg"
                alt="Marina"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Season Slip Application */}
      <section className="py-16 px-4 bg-[var(--off-white)]">
        <div className="max-w-4xl mx-auto">
          <SeasonSlipApplicationForm publicEndIso={import.meta.env.VITE_SEASON_SLIP_PUBLIC_END as any} />
        </div>
      </section>

      {/* Fuel Station */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-lg overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1758552396011-1610e8a4c1c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wZ3JvdW5kJTIwcml2ZXIlMjB2aWV3fGVufDF8fHx8MTc2MzE3MzkyOHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="River View"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="mb-6">Fuel Station</h2>
              <p className="mb-6">
                Our convenient pay-at-pump fuel station serves both boats and vehicles. Available 
                during marina operating hours for your convenience.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <span>Pay-at-pump convenience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <span>Marine and automotive fuel available</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <span>Competitive pricing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <span>Open weather permitting (weather dependent)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* River Route Map */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center mb-6">Explore the River</h2>
          <p className="text-center max-w-2xl mx-auto mb-12">
            The Allegheny River offers countless opportunities for exploration. From fishing to 
            cruising, there's always an adventure waiting on the water.
          </p>

          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Waves size={32} className="text-white" />
                </div>
                <h5 className="mb-2">Boating</h5>
                <p className="text-sm text-[var(--forest-green)]/70">
                  Cruise the scenic Allegheny River
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
                  </svg>
                </div>
                <h5 className="mb-2">Fishing</h5>
                <p className="text-sm text-[var(--forest-green)]/70">
                  Excellent bass, walleye, and catfish
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--river-blue)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bird size={32} className="text-white" />
                </div>
                <h5 className="mb-2">Wildlife Watching</h5>
                <p className="text-sm text-[var(--forest-green)]/70">
                  Spot bald eagles, herons, and more
                </p>
              </div>
            </div>

            {/* Interactive river map */}
            <RiverMap />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[var(--forest-green)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-white mb-6">Reserve Your Marina Slip</h2>
          <p className="text-xl mb-8 text-white/90">
            Limited slips available for the 2025 season. Contact us today to secure your spot on the river.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton
              variant="secondary"
              onClick={() => onNavigate('contact')}
              className="h-12 px-8"
            >
              Contact Marina Office
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
