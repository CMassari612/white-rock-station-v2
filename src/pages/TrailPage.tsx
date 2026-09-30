import { Bike, Users, Map, MapPin } from 'lucide-react';
import { CTAButton } from '../components/CTAButton';
import { StatCard } from '../components/StatCard';
import { Ed } from '../lib/siteText';
import { TrailMap } from '../components/TrailMap';

interface TrailPageProps {
  onNavigate: (page: string) => void;
}

export function TrailPage({ onNavigate }: TrailPageProps) {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative h-96 flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: `url('/images/scenery/Scenery%2023.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 50%',
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <Ed as="h1" id="trail.hero.title" className="text-white mb-4">Armstrong Trails</Ed>
          <Ed as="p" id="trail.hero.sub" className="text-xl text-white/90">Pennsylvania's Premier Rail-Trail</Ed>
        </div>
      </section>

      {/* Trail Overview */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Ed as="h2" id="trail.overview.title" className="mb-4">Direct Access to Adventure</Ed>
            <Ed as="p" id="trail.overview.sub" className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">White Rock Station offers direct access to the Armstrong Trails, one of Pennsylvania's most popular rail-trails. Perfect for biking, hiking, and exploring the scenic Allegheny Valley.</Ed>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard
              value={<Ed as="span" id="trail.stat1.value">1 Million</Ed>}
              label={<Ed as="span" id="trail.stat1.label">Day Users Annually</Ed>}
              icon={<Bike size={32} className="text-[var(--river-blue)]" />}
            />
            <StatCard
              value={<Ed as="span" id="trail.stat2.value">200,000</Ed>}
              label={<Ed as="span" id="trail.stat2.label">Overnight Users</Ed>}
              icon={<Users size={32} className="text-[var(--river-blue)]" />}
            />
            <StatCard
              value={<Ed as="span" id="trail.stat3.value">52 Miles</Ed>}
              label={<Ed as="span" id="trail.stat3.label">Of Scenic Rail-Trail</Ed>}
              icon={<Map size={32} className="text-[var(--river-blue)]" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Ed as="h3" id="trail.about.title" className="mb-6">About the Armstrong Trails</Ed>
              <Ed as="p" id="trail.about.p1" className="mb-4">The Armstrong Trails is a 52-mile non-motorized rail-trail that follows the scenic Allegheny River through Armstrong County, Pennsylvania. The trail connects multiple river towns and offers stunning views of the valley.</Ed>
              <Ed as="p" id="trail.about.p2" className="mb-6">Built on the former Pennsylvania Railroad corridor, the trail features a smooth, crushed limestone surface perfect for cycling, walking, and running. With minimal grade changes, it's accessible for all skill levels.</Ed>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <Ed as="span" id="trail.about.1">52 miles of scenic trail</Ed>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <Ed as="span" id="trail.about.2">Crushed limestone surface</Ed>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <Ed as="span" id="trail.about.3">Suitable for all skill levels</Ed>
                </li>
                <li className="flex items-start">
                  <span className="text-[var(--river-blue)] mr-2">✓</span>
                  <Ed as="span" id="trail.about.4">Connects historic river towns</Ed>
                </li>
              </ul>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img
                src="/images/scenery/Scenery%2007.jpg"
                alt="White Rock Station sign"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Towns */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <Ed as="h2" id="trail.towns.title" className="text-center mb-12">Explore Nearby River Towns</Ed>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <MapPin size={24} className="text-white" />
              </div>
              <Ed as="h4" id="trail.towns.1.title" className="mb-3">Kittanning</Ed>
              <Ed as="p" id="trail.towns.1.desc" className="text-sm text-[var(--forest-green)]/70 mb-3">The county seat of Armstrong County, Kittanning offers historic charm, local dining, and shopping along the riverfront.</Ed>
              <p className="text-sm">
                <Ed as="span" id="trail.towns.1.distlabel" className="text-[var(--river-blue)]">Distance:</Ed> <Ed as="span" id="trail.towns.1.dist">~19 miles north · ~2 hr by bike</Ed>
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <MapPin size={24} className="text-white" />
              </div>
              <Ed as="h4" id="trail.towns.2.title" className="mb-3">Ford City</Ed>
              <Ed as="p" id="trail.towns.2.desc" className="text-sm text-[var(--forest-green)]/70 mb-3">A historic glass manufacturing town with unique shops, restaurants, and the Armstrong County Historical Museum.</Ed>
              <p className="text-sm">
                <Ed as="span" id="trail.towns.2.distlabel" className="text-[var(--river-blue)]">Distance:</Ed> <Ed as="span" id="trail.towns.2.dist">~15 miles north · ~1 hr 40 min by bike</Ed>
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center mb-4">
                <MapPin size={24} className="text-white" />
              </div>
              <Ed as="h4" id="trail.towns.3.title" className="mb-3">Leechburg</Ed>
              <Ed as="p" id="trail.towns.3.desc" className="text-sm text-[var(--forest-green)]/70 mb-3">Quaint river town with antique shops, local eateries, and beautiful Victorian architecture along the trail.</Ed>
              <p className="text-sm">
                <Ed as="span" id="trail.towns.3.distlabel" className="text-[var(--river-blue)]">Distance:</Ed> <Ed as="span" id="trail.towns.3.dist">~6 miles south · ~40 min by bike</Ed>
              </p>
            </div>
          </div>

          <TrailMap />
        </div>
      </section>

      {/* Trail Activities */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <Ed as="h2" id="trail.activities.title" className="text-center mb-12">Trail Activities</Ed>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-[var(--sand-tan)]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bike size={40} className="text-[var(--river-blue)]" />
              </div>
              <Ed as="h5" id="trail.activities.1.title" className="mb-2">Cycling</Ed>
              <Ed as="p" id="trail.activities.1.desc" className="text-sm text-[var(--forest-green)]/70">52 miles of smooth trail perfect for road and mountain bikes</Ed>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[var(--sand-tan)]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[var(--river-blue)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
                </svg>
              </div>
              <Ed as="h5" id="trail.activities.2.title" className="mb-2">Hiking</Ed>
              <Ed as="p" id="trail.activities.2.desc" className="text-sm text-[var(--forest-green)]/70">Walk the scenic trail at your own pace with minimal elevation</Ed>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[var(--sand-tan)]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[var(--river-blue)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                </svg>
              </div>
              <Ed as="h5" id="trail.activities.3.title" className="mb-2">Running</Ed>
              <Ed as="p" id="trail.activities.3.desc" className="text-sm text-[var(--forest-green)]/70">Train or jog on the flat, traffic-free surface</Ed>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[var(--sand-tan)]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[var(--river-blue)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 10h5v7H5zm6-5h8v3h-8zm0 4h8v3h-8zm0 4h4v3h-4z"/>
                </svg>
              </div>
              <Ed as="h5" id="trail.activities.4.title" className="mb-2">Photography</Ed>
              <Ed as="p" id="trail.activities.4.desc" className="text-sm text-[var(--forest-green)]/70">Capture stunning river and valley views year-round</Ed>
            </div>
          </div>
        </div>
      </section>

      {/* Trail Map Section */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-8 md:p-12 shadow-lg">
            <div className="text-center mb-8">
              <Map size={64} className="mx-auto mb-4 text-[var(--river-blue)]" />
              <Ed as="h2" id="trail.map.title" className="mb-4">Trail Map &amp; Information</Ed>
              <Ed as="p" id="trail.map.sub" className="text-[var(--forest-green)]/70 max-w-2xl mx-auto">Plan your journey along the Armstrong Trails. Download trail maps, view access points, and discover points of interest along the route.</Ed>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[var(--sand-tan)]/30 p-6 rounded-lg">
                <Ed as="h5" id="trail.map.highlights.title" className="mb-3">Trail Highlights</Ed>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-[var(--river-blue)] mr-2">•</span>
                    <Ed as="span" id="trail.map.highlights.1">Multiple access points along the 52-mile route</Ed>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--river-blue)] mr-2">•</span>
                    <Ed as="span" id="trail.map.highlights.2">Rest areas and benches at regular intervals</Ed>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--river-blue)] mr-2">•</span>
                    <Ed as="span" id="trail.map.highlights.3">Scenic overlooks of the Allegheny River</Ed>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--river-blue)] mr-2">•</span>
                    <Ed as="span" id="trail.map.highlights.4">Historic markers and interpretive signs</Ed>
                  </li>
                </ul>
              </div>

              <div className="bg-[var(--sand-tan)]/30 p-6 rounded-lg">
                <Ed as="h5" id="trail.map.amenities.title" className="mb-3">Trail Amenities</Ed>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-[var(--river-blue)] mr-2">•</span>
                    <Ed as="span" id="trail.map.amenities.1">Restrooms at major access points</Ed>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--river-blue)] mr-2">•</span>
                    <Ed as="span" id="trail.map.amenities.2">Parking areas in river towns</Ed>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--river-blue)] mr-2">•</span>
                    <Ed as="span" id="trail.map.amenities.3">Local restaurants and shops nearby</Ed>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--river-blue)] mr-2">•</span>
                    <Ed as="span" id="trail.map.amenities.4">Bike repair stations at select locations</Ed>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Economic Impact */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Ed as="h2" id="trail.economic.title" className="mb-4">Supporting Local Communities</Ed>
            <Ed as="p" id="trail.economic.sub" className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">The Armstrong Trails brings significant economic benefits to the region, supporting local businesses and tourism throughout Armstrong County.</Ed>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[var(--sand-tan)]/30 p-6 rounded-lg text-center">
              <Ed as="div" id="trail.economic.1.value" className="text-[var(--river-blue)] mb-2">1 Million+</Ed>
              <Ed as="p" id="trail.economic.1.desc" className="text-[var(--forest-green)]/70">Annual day users enjoying the trail</Ed>
            </div>
            <div className="bg-[var(--sand-tan)]/30 p-6 rounded-lg text-center">
              <Ed as="div" id="trail.economic.2.value" className="text-[var(--river-blue)] mb-2">200,000</Ed>
              <Ed as="p" id="trail.economic.2.desc" className="text-[var(--forest-green)]/70">Overnight visitors staying in the area</Ed>
            </div>
            <div className="bg-[var(--sand-tan)]/30 p-6 rounded-lg text-center">
              <Ed as="div" id="trail.economic.3.value" className="text-[var(--river-blue)] mb-2">Free</Ed>
              <Ed as="p" id="trail.economic.3.desc" className="text-[var(--forest-green)]/70">Public trail access for all visitors</Ed>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[var(--forest-green)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Ed as="h2" id="trail.cta.title" className="text-white mb-6">Stay Here, Explore Armstrong</Ed>
          <Ed as="p" id="trail.cta.sub" className="text-xl mb-8 text-white/90">Make White Rock Station your base camp for exploring the Armstrong Trails. Book your cabin or campsite today!</Ed>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton
              variant="secondary"
              onClick={() => onNavigate('cottages')}
              className="h-12 px-8"
            >
              <Ed as="span" id="trail.cta.book">Book Your Stay</Ed>
            </CTAButton>
            <a
              href="tel:724-882-9195"
              className="inline-flex items-center justify-center h-12 px-8 bg-white text-[var(--forest-green)] rounded-full hover:bg-[var(--sand-tan)] transition-all duration-300 hover:shadow-lg"
            >
              <Ed as="span" id="trail.cta.call">Call: (724) 882-9195</Ed>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
