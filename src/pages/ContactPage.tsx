import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
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

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapAddress = '395 Silvis Hollow Rd, Kittanning, PA 16201';
  const mapsLink = `https://maps.google.com/?q=${encodeURIComponent(mapAddress)}`;

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
          <h1 className="text-white mb-4">Get In Touch</h1>
          <p className="text-xl text-white/90">We're here to help plan your perfect getaway</p>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="mb-6">Contact Information</h2>
              <p className="mb-8 text-[var(--forest-green)]/70">
                Have questions about lodging, the marina, or amenities? We'd love to hear from you. 
                Reach out and our team will respond promptly.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div>
                    <h5 className="mb-1">Address</h5>
                    <p className="text-[var(--forest-green)]/70">
                      395 Silvis Hollow Rd<br />
                      Kittanning, PA 16201
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone size={24} className="text-white" />
                  </div>
                  <div>
                    <h5 className="mb-1">Phone</h5>
                    <a href="tel:724-882-9195" className="text-[var(--river-blue)] hover:underline">
                      (724) 882-9195
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail size={24} className="text-white" />
                  </div>
                  <div>
                    <h5 className="mb-1">Email</h5>
                    <a href="mailto:info@whiterockstation.com" className="text-[var(--river-blue)] hover:underline">
                      info@whiterockstation.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div>
                    <h5 className="mb-1">Office Hours</h5>
                    <p className="text-[var(--forest-green)]/70">
                      Monday - Friday: 9am - 5pm<br />
                      Saturday: 10am - 5pm
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--river-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar size={24} className="text-white" />
                  </div>
                  <div>
                    <h5 className="mb-1">Season</h5>
                    <p className="text-[var(--forest-green)]/70">
                      Cabins & Camping: Year-Round<br />
                      Marina: April - October
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-[var(--sand-tan)]/20 rounded-lg p-8">
              <h3 className="mb-6">Send Us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm">
                    Name *
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
                    Email *
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
                    Phone
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
                    Message *
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
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center mb-8">Find Us</h2>
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            {mapsApiKey ? (
              <iframe
                title="White Rock Station location map"
                src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${encodeURIComponent(mapAddress)}&zoom=14`}
                className="block aspect-video w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              /* Fallback shown until VITE_GOOGLE_MAPS_API_KEY is set */
              <div className="aspect-video bg-[var(--sand-tan)]/30 flex items-center justify-center">
                <div className="text-center p-8">
                  <MapPin size={64} className="mx-auto mb-4 text-[var(--river-blue)]" />
                  <h4 className="mb-2">Location Map</h4>
                  <p className="text-[var(--forest-green)]/70 mb-4">{mapAddress}</p>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--river-blue)] hover:underline"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <h5 className="mb-4">Directions</h5>
            <p className="max-w-2xl mx-auto text-[var(--forest-green)]/70">
              Located along the Allegheny River, just off Route 85. Easily accessible from 
              Pittsburgh (1 hour), Erie (2 hours), and Cleveland (2.5 hours). Follow signs 
              for the Armstrong Trail.
            </p>
          </div>
        </div>
      </section>

      {/* About/History Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center mb-12">Our Story</h2>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <div className="text-[var(--warm-brown)] mb-2">Ancient Roots</div>
              <h4 className="mb-3">Native American Heritage</h4>
              <p className="text-[var(--forest-green)]/70">
                Long before White Rock Station, this land along the Allegheny River was home to 
                Native American communities who recognized the strategic importance and natural 
                beauty of this riverside location.
              </p>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <div className="text-[var(--warm-brown)] mb-2">1800s - Early 1900s</div>
              <h4 className="mb-3">The Johnetta Industrial Era</h4>
              <p className="text-[var(--forest-green)]/70">
                The area flourished as Johnetta, a bustling industrial community. The Johnetta Fire 
                Brick Company established operations here, taking advantage of the river's transportation 
                routes and abundant natural resources.
              </p>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <div className="text-[var(--warm-brown)] mb-2">Early 1900s</div>
              <h4 className="mb-3">The Johnetta Hotel</h4>
              <p className="text-[var(--forest-green)]/70">
                The historic Johnetta Hotel served travelers and workers, becoming a cornerstone of 
                the community. This tradition of hospitality laid the foundation for what would 
                become White Rock Station.
              </p>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <div className="text-[var(--warm-brown)] mb-2">Mid-1900s</div>
              <h4 className="mb-3">Transformation to Campground</h4>
              <p className="text-[var(--forest-green)]/70">
                As industry evolved, the property transitioned from industrial use to recreational. 
                The campground emerged as families sought outdoor recreation along the beautiful 
                Allegheny River.
              </p>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <div className="text-[var(--warm-brown)] mb-2">2024</div>
              <h4 className="mb-3">White Rock Station Restoration</h4>
              <p className="text-[var(--forest-green)]/70">
                Major restoration and modernization brought new life to the property. Upgraded 
                facilities, new cabins, and enhanced amenities were added while preserving the 
                natural beauty and historic character that makes this location special.
              </p>
            </div>

            <div className="border-l-4 border-[var(--river-blue)] pl-6">
              <div className="text-[var(--warm-brown)] mb-2">Today</div>
              <h4 className="mb-3">Your Riverside Destination</h4>
              <p className="text-[var(--forest-green)]/70">
                White Rock Station continues the tradition of welcoming visitors to this special 
                place along the Allegheny River. We blend modern conveniences with natural beauty, 
                offering a perfect escape for families, outdoor enthusiasts, and trail users.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[var(--forest-green)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-white mb-6">Plan Your Visit</h2>
          <p className="text-xl mb-8 text-white/90">
            We're excited to welcome you to White Rock Station. Contact us today or book your stay online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton
              variant="secondary"
              onClick={() => onNavigate('cottages')}
              className="h-12 px-8"
            >
              Book Your Stay
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
