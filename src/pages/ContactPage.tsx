import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Ed } from '../lib/siteText';
import { CTAButton } from '../components/CTAButton';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // Exact map pin (drops on the property, not a geocoded street address)
  const mapPin = '40.698148,-79.605329';
  const mapsLink = `https://maps.google.com/?q=${mapPin}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission would be handled here
    alert('Thank you for your message! We\'ll be in touch soon.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative h-80 flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/scenery/Scenery%2004.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <Ed as="h1" id="contact.hero.title" className="text-white mb-4">Get In Touch</Ed>
          <Ed as="p" id="contact.hero.sub" className="text-xl text-white/90">We're here to help plan your perfect getaway</Ed>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <Ed as="h2" id="contact.info.title" className="mb-6">Contact Information</Ed>
              <Ed as="p" id="contact.info.sub" className="mb-8 text-[var(--forest-green)]/70">Have questions about lodging, the marina, or amenities? We'd love to hear from you. Reach out and our team will respond promptly.</Ed>

              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div>
                    <Ed as="h5" id="contact.info.address.label" className="mb-1">Address</Ed>
                    <p className="text-[var(--forest-green)]/70">
                      <Ed as="span" id="contact.info.address.line1">149 Upper Allegheny Drive</Ed><br />
                      <Ed as="span" id="contact.info.address.line2">Vandergrift, PA 15690</Ed><br />
                      <Ed as="span" id="contact.info.address.mailing">Mailing: PO Box 393, Leechburg, PA 15656</Ed>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone size={24} className="text-white" />
                  </div>
                  <div>
                    <Ed as="h5" id="contact.info.phone.label" className="mb-1">Phone</Ed>
                    <a href="tel:724-882-9195" className="text-[var(--river-blue)] hover:underline">
                      <Ed as="span" id="contact.info.phone.value">(724) 882-9195</Ed>
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail size={24} className="text-white" />
                  </div>
                  <div>
                    <Ed as="h5" id="contact.info.email.label" className="mb-1">Email</Ed>
                    <a href="mailto:info@whiterockstation.com" className="text-[var(--river-blue)] hover:underline">
                      <Ed as="span" id="contact.info.email.value">info@whiterockstation.com</Ed>
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div>
                    <Ed as="h5" id="contact.info.hours.label" className="mb-1">Office Hours</Ed>
                    <p className="text-[var(--forest-green)]/70">
                      <Ed as="span" id="contact.info.hours.line1">We usually reply within a day</Ed><br />
                      <Ed as="span" id="contact.info.hours.line2">Messages welcome anytime</Ed>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar size={24} className="text-white" />
                  </div>
                  <div>
                    <Ed as="h5" id="contact.info.season.label" className="mb-1">Season</Ed>
                    <Ed as="p" id="contact.info.season.value" className="text-[var(--forest-green)]/70">Cabins, campsites &amp; marina: Open seasonally, April through October</Ed>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-[var(--sand-tan)]/20 rounded-lg p-8">
              <Ed as="h3" id="contact.form.title" className="mb-6">Send Us a Message</Ed>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm">
                    <Ed as="span" id="contact.form.name">Name *</Ed>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2 text-sm">
                    <Ed as="span" id="contact.form.email">Email *</Ed>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block mb-2 text-sm">
                    <Ed as="span" id="contact.form.phone">Phone</Ed>
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block mb-2 text-sm">
                    <Ed as="span" id="contact.form.message">Message *</Ed>
                  </label>
                  <Textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[var(--river-blue)] hover:bg-[var(--river-blue)]/90 text-white rounded-full"
                >
                  <Ed as="span" id="contact.form.submit">Send Message</Ed>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Here */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <Ed as="h2" id="contact.here.title" className="text-center mb-8">Getting Here</Ed>
          <div className="space-y-4 text-[var(--forest-green)]/80 leading-relaxed">
            <Ed as="p" id="contact.here.p1">White Rock Station is tucked along the Allegheny River in Gilpin Township, Armstrong County, between Leechburg and Ford City. While our mailing address is Vandergrift, we are not located in downtown Vandergrift.</Ed>
            <Ed as="p" id="contact.here.p2">We sit directly along Armstrong Trails and just off Route 66, surrounded by the river, wooded hills, and miles of trail.</Ed>
            <Ed as="p" id="contact.here.p3">We're about an hour from Pittsburgh, with easy connections from Routes 28, 422, and 356. From the Pittsburgh area, the drive gradually trades highways and suburbs for small towns, river views, and the rolling hills of western Pennsylvania.</Ed>
          </div>

          <Ed as="h3" id="contact.here.drivetitle" className="mt-8 mb-4">Approximate drive times</Ed>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 max-w-2xl mx-auto text-[var(--forest-green)]/80">
            <div className="flex items-baseline justify-between border-b border-[var(--sand-tan)]/60 py-2.5"><Ed as="span" id="contact.here.d1a">Leechburg</Ed><Ed as="span" id="contact.here.d1b" className="text-[var(--forest-green)]/60 whitespace-nowrap pl-6">10 minutes</Ed></div>
            <div className="flex items-baseline justify-between border-b border-[var(--sand-tan)]/60 py-2.5"><Ed as="span" id="contact.here.d2a">Ford City</Ed><Ed as="span" id="contact.here.d2b" className="text-[var(--forest-green)]/60 whitespace-nowrap pl-6">15 minutes</Ed></div>
            <div className="flex items-baseline justify-between border-b border-[var(--sand-tan)]/60 py-2.5"><Ed as="span" id="contact.here.d3a">Kittanning</Ed><Ed as="span" id="contact.here.d3b" className="text-[var(--forest-green)]/60 whitespace-nowrap pl-6">25 minutes</Ed></div>
            <div className="flex items-baseline justify-between border-b border-[var(--sand-tan)]/60 py-2.5"><Ed as="span" id="contact.here.d4a">Monroeville</Ed><Ed as="span" id="contact.here.d4b" className="text-[var(--forest-green)]/60 whitespace-nowrap pl-6">45 minutes</Ed></div>
            <div className="flex items-baseline justify-between border-b border-[var(--sand-tan)]/60 py-2.5"><Ed as="span" id="contact.here.d5a">Greensburg</Ed><Ed as="span" id="contact.here.d5b" className="text-[var(--forest-green)]/60 whitespace-nowrap pl-6">45 minutes</Ed></div>
            <div className="flex items-baseline justify-between border-b border-[var(--sand-tan)]/60 py-2.5"><Ed as="span" id="contact.here.d6a">Indiana, PA</Ed><Ed as="span" id="contact.here.d6b" className="text-[var(--forest-green)]/60 whitespace-nowrap pl-6">50 minutes</Ed></div>
            <div className="flex items-baseline justify-between border-b border-[var(--sand-tan)]/60 py-2.5"><Ed as="span" id="contact.here.d7a">Butler</Ed><Ed as="span" id="contact.here.d7b" className="text-[var(--forest-green)]/60 whitespace-nowrap pl-6">55 minutes</Ed></div>
            <div className="flex items-baseline justify-between border-b border-[var(--sand-tan)]/60 py-2.5"><Ed as="span" id="contact.here.d8a">Pittsburgh</Ed><Ed as="span" id="contact.here.d8b" className="text-[var(--forest-green)]/60 whitespace-nowrap pl-6">1 hour</Ed></div>
            <div className="flex items-baseline justify-between border-b border-[var(--sand-tan)]/60 py-2.5"><Ed as="span" id="contact.here.d9a">Cranberry Township</Ed><Ed as="span" id="contact.here.d9b" className="text-[var(--forest-green)]/60 whitespace-nowrap pl-6">1 hour</Ed></div>
          </div>
          <Ed as="p" id="contact.here.close" className="mt-12 text-center italic text-[var(--forest-green)]/70">Close enough for a weekend away without spending half of it getting here.</Ed>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <Ed as="h2" id="contact.map.title" className="text-center mb-8">Find Us</Ed>
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <iframe
              title="White Rock Station location map"
              src={`https://maps.google.com/maps?q=${mapPin}&z=15&output=embed`}
              className="block aspect-video w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="mt-4 text-center">
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--river-blue)] hover:underline"
            >
              <Ed as="span" id="contact.map.link">Open in Google Maps →</Ed>
            </a>
          </div>
        </div>
      </section>

      {/* About/History Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <Ed as="h2" id="contact.story.title" className="text-center mb-12">Our Story</Ed>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <Ed as="div" id="contact.story.1.era" className="text-[var(--warm-brown)] mb-2">Ancient Roots</Ed>
              <Ed as="h4" id="contact.story.1.title" className="mb-3">Native American Heritage</Ed>
              <Ed as="p" id="contact.story.1.desc" className="text-[var(--forest-green)]/70">Long before White Rock Station, this land along the Allegheny River was home to Native American communities who recognized the strategic importance and natural beauty of this riverside location.</Ed>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <Ed as="div" id="contact.story.2.era" className="text-[var(--warm-brown)] mb-2">1800s - Early 1900s</Ed>
              <Ed as="h4" id="contact.story.2.title" className="mb-3">The Johnetta Industrial Era</Ed>
              <Ed as="p" id="contact.story.2.desc" className="text-[var(--forest-green)]/70">The area flourished as Johnetta, a bustling industrial community. The Johnetta Fire Brick Company established operations here, taking advantage of the river's transportation routes and abundant natural resources.</Ed>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <Ed as="div" id="contact.story.3.era" className="text-[var(--warm-brown)] mb-2">Early 1900s</Ed>
              <Ed as="h4" id="contact.story.3.title" className="mb-3">The Johnetta Hotel</Ed>
              <Ed as="p" id="contact.story.3.desc" className="text-[var(--forest-green)]/70">The historic Johnetta Hotel served travelers and workers, becoming a cornerstone of the community. This tradition of hospitality laid the foundation for what would become White Rock Station.</Ed>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <Ed as="div" id="contact.story.4.era" className="text-[var(--warm-brown)] mb-2">Mid-1900s</Ed>
              <Ed as="h4" id="contact.story.4.title" className="mb-3">Transformation to Campground</Ed>
              <Ed as="p" id="contact.story.4.desc" className="text-[var(--forest-green)]/70">As industry evolved, the property transitioned from industrial use to recreational. The campground emerged as families sought outdoor recreation along the beautiful Allegheny River.</Ed>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <Ed as="div" id="contact.story.5.era" className="text-[var(--warm-brown)] mb-2">2024</Ed>
              <Ed as="h4" id="contact.story.5.title" className="mb-3">White Rock Station Restoration</Ed>
              <Ed as="p" id="contact.story.5.desc" className="text-[var(--forest-green)]/70">Major restoration and modernization brought new life to the property. Upgraded facilities, new cabins, and enhanced amenities were added while preserving the natural beauty and historic character that makes this location special.</Ed>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <Ed as="div" id="contact.story.6.era" className="text-[var(--warm-brown)] mb-2">Today</Ed>
              <Ed as="h4" id="contact.story.6.title" className="mb-3">Your Riverside Destination</Ed>
              <Ed as="p" id="contact.story.6.desc" className="text-[var(--forest-green)]/70">White Rock Station continues the tradition of welcoming visitors to this special place along the Allegheny River. We blend modern conveniences with natural beauty, offering a perfect escape for families, outdoor enthusiasts, and trail users.</Ed>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[var(--forest-green)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Ed as="h2" id="contact.cta.title" className="text-white mb-6">Plan Your Visit</Ed>
          <Ed as="p" id="contact.cta.sub" className="text-xl mb-8 text-white/90">We're excited to welcome you to White Rock Station. Contact us today or book your stay online.</Ed>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton
              variant="secondary"
              onClick={() => onNavigate('cottages')}
              className="h-12 px-8"
            >
              <Ed as="span" id="contact.cta.book">Book Your Stay</Ed>
            </CTAButton>
            <a
              href="tel:724-882-9195"
              className="inline-flex items-center justify-center h-12 px-8 bg-white text-[var(--forest-green)] rounded-full hover:bg-[var(--sand-tan)] transition-all duration-300 hover:shadow-lg"
            >
              <Ed as="span" id="contact.cta.call">Call: (724) 882-9195</Ed>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
