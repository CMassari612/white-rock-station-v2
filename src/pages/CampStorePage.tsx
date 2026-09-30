import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Store as StoreIcon, Truck, Clock, Plus, Minus, X, CheckCircle } from 'lucide-react';
import { CTAButton } from '../components/CTAButton';
import { fetchStore, createStoreCheckout, dollars, StoreProduct, Fulfillment, MERCH_TAX_RATE } from '../lib/store';
import { PhotoCarousel } from '../components/PhotoCarousel';
import { Ed } from '../lib/siteText';

// Camp store photos for the Johnetta Supply carousel (storefront + interior).
const SUPPLY_CAROUSEL = [
  '/images/store/store-11.jpg',
  '/images/store/store-07.jpg',
  '/images/store/store-08.jpg',
  '/images/store/store-10.jpg',
  '/images/store/store-01.jpg',
  '/images/store/store-04.jpg',
  '/images/store/store-05.jpg',
  '/images/store/store-09.jpg',
];

interface CampStorePageProps {
  onNavigate: (page: string) => void;
}

// Store gallery — placeholder scenery shots for the draft. Replace with real
// photos of Johnetta Supply and the merch when available.
const GALLERY = [
  '/images/store/store-01.jpg',
  '/images/store/store-04.jpg',
  '/images/store/store-05.jpg',
  '/images/store/store-07.jpg',
  '/images/store/store-08.jpg',
  '/images/store/store-09.jpg',
];

const PHONE_DISPLAY = '(724) 882-9195';
const PHONE_TEL = '724-882-9195';

export function CampStorePage({ onNavigate }: CampStorePageProps) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [shipFeeCents, setShipFeeCents] = useState(800);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup');
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<'success' | 'cancel' | null>(null);

  useEffect(() => {
    fetchStore()
      .then((s) => { setProducts(s.products); setShipFeeCents(s.shipFeeCents); })
      .catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const c = params.get('checkout');
    if (c === 'success') { setBanner('success'); setCart({}); }
    else if (c === 'cancel') { setBanner('cancel'); }
  }, []);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id: string) => setCart((c) => {
    const n = (c[id] || 0) - 1;
    const next = { ...c };
    if (n <= 0) delete next[id]; else next[id] = n;
    return next;
  });
  const removeItem = (id: string) => setCart((c) => { const next = { ...c }; delete next[id]; return next; });

  const cartLines = useMemo(
    () => Object.entries(cart)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
      .filter((l) => l.product) as { product: StoreProduct; qty: number }[],
    [cart, products]
  );
  const itemCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const subtotalCents = cartLines.reduce((n, l) => n + l.product.priceCents * l.qty, 0);
  const taxableCents = cartLines.reduce((n, l) => n + (l.product.taxable ? l.product.priceCents * l.qty : 0), 0);
  const taxCents = Math.round(taxableCents * MERCH_TAX_RATE);
  const shippingCents = fulfillment === 'ship' && itemCount > 0 ? shipFeeCents : 0;
  const totalCents = subtotalCents + taxCents + shippingCents;

  async function checkout() {
    setError(null);
    if (itemCount === 0) return;
    setCheckingOut(true);
    try {
      const items = cartLines.map((l) => ({ id: l.product.id, qty: l.qty }));
      const url = await createStoreCheckout(items, fulfillment);
      window.location.href = url; // to Stripe Checkout
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
      setCheckingOut(false);
    }
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative h-96 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/images/store/store-10.jpg')` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <Ed as="h1" id="store.hero.title" className="text-white mb-3">Johnetta Supply</Ed>
          <Ed as="p" id="store.hero.sub" className="text-xl text-white/90 max-w-2xl mx-auto">Camp essentials and White Rock goods.</Ed>
        </div>
      </section>

      {/* Order status banner */}
      {banner && (
        <div className="px-4 pt-6 max-w-7xl mx-auto">
          <div
            className="rounded-lg p-4 flex items-start gap-3"
            style={{ background: banner === 'success' ? 'rgba(47,122,79,0.12)' : 'rgba(178,59,59,0.10)' }}
          >
            <CheckCircle size={22} className="text-[var(--river-blue)] mt-0.5" />
            <div>
              {banner === 'success' ? (
                <Ed as="p" id="store.banner.success" className="text-[var(--forest-green)]">Thanks for your order! You'll get an email confirmation from Stripe. We'll text you when a pickup order is ready.</Ed>
              ) : (
                <Ed as="p" id="store.banner.cancel" className="text-[var(--forest-green)]">Checkout canceled — your cart is still here whenever you're ready.</Ed>
              )}
            </div>
          </div>
        </div>
      )}

      {/* About Johnetta Supply */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Ed as="p" id="store.about.eyebrow" className="uppercase tracking-widest text-[var(--river-blue)] mb-3">Our Camp Store</Ed>
              <Ed as="h2" id="store.about.title" className="mb-6">Johnetta Supply</Ed>
              <Ed as="p" id="store.about.p1" className="mb-5 text-[var(--forest-green)]/80">Johnetta Supply is our seasonal camp store, stocked with everyday camping essentials, snacks, cold drinks, firewood, and a few things you may have forgotten at home.</Ed>
              <Ed as="p" id="store.about.p2" className="mb-5 text-[var(--forest-green)]/80">You'll also find White Rock Station hats, T-shirts, sweatshirts, and other merchandise to take home from your time along the Allegheny.</Ed>
              <Ed as="p" id="store.about.p3" className="mb-8 text-[var(--forest-green)]/80">Seasonal store hours vary. Select White Rock Station apparel and merchandise is also available to purchase online.</Ed>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[var(--sand-tan)]/30 rounded-lg p-5">
                  <ShoppingBag className="text-[var(--river-blue)] mb-2" size={26} />
                  <Ed as="h5" id="store.feat.1.title" className="mb-1">Camp Essentials</Ed>
                  <Ed as="p" id="store.feat.1.desc" className="text-sm text-[var(--forest-green)]/70">Snacks, drinks &amp; firewood</Ed>
                </div>
                <div className="bg-[var(--sand-tan)]/30 rounded-lg p-5">
                  <StoreIcon className="text-[var(--river-blue)] mb-2" size={26} />
                  <Ed as="h5" id="store.feat.2.title" className="mb-1">White Rock Goods</Ed>
                  <Ed as="p" id="store.feat.2.desc" className="text-sm text-[var(--forest-green)]/70">Hats, tees &amp; sweatshirts</Ed>
                </div>
                <div className="bg-[var(--sand-tan)]/30 rounded-lg p-5">
                  <Clock className="text-[var(--river-blue)] mb-2" size={26} />
                  <Ed as="h5" id="store.feat.3.title" className="mb-1">Seasonal Hours</Ed>
                  <Ed as="p" id="store.feat.3.desc" className="text-sm text-[var(--forest-green)]/70">Hours vary by season</Ed>
                </div>
              </div>
            </div>

            <PhotoCarousel images={SUPPLY_CAROUSEL} alt="Johnetta Supply camp store" />
          </div>
        </div>
      </section>

      {/* Historical note */}
      <section className="py-12 px-4 bg-[var(--forest-green)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Ed as="p" id="store.historical.note" className="text-lg text-white/90 italic">Named for Johnetta, the historic river and mining community that once stood on the land surrounding White Rock Station.</Ed>
        </div>
      </section>

      {/* Shop */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Ed as="p" id="store.shop.eyebrow" className="uppercase tracking-widest text-[var(--river-blue)] mb-3">Shop the Merch</Ed>
            <Ed as="h2" id="store.shop.title" className="mb-4">White Rock Station Goods</Ed>
            <Ed as="p" id="store.shop.sub" className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">Take the river home with you. Choose store pickup or shipping at checkout.</Ed>
          </div>

          <div>
            {/* Products */}
            <div className="flex flex-wrap justify-center gap-6">
              {products.map((p) => (
                <div key={p.id} className="w-full sm:w-64 bg-white rounded-xl overflow-hidden border border-[var(--sand-tan)] shadow-sm hover:shadow-md transition flex flex-col">
                  <div className="aspect-[4/3] overflow-hidden bg-[var(--sand-tan)]/30">
                    {p.image ? (
                      <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: p.accent }}>
                        <img src="/brand/wrs-lockup-cream.png" alt={p.name} style={{ height: 64, width: 'auto', opacity: 0.95 }} />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-start justify-between gap-2" style={{ minHeight: '2.75rem' }}>
                      <h4 className="text-base leading-snug">{p.name}</h4>
                      <span className="text-[var(--river-blue)] whitespace-nowrap font-semibold">{dollars(p.priceCents)}</span>
                    </div>
                    <p
                      className="text-sm text-[var(--forest-green)]/70 mt-2"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}
                    >{p.blurb}</p>
                    <div className="mt-auto pt-6">
                      {cart[p.id] ? (
                        <div className="flex items-center justify-between h-11">
                          <div className="flex items-center gap-2">
                            <button aria-label="Remove one" onClick={() => dec(p.id)} className="w-9 h-9 rounded-full border border-[var(--sand-tan)] flex items-center justify-center hover:bg-[var(--sand-tan)]/30">
                              <Minus size={16} />
                            </button>
                            <span className="min-w-[1.5rem] text-center font-semibold">{cart[p.id]}</span>
                            <button aria-label="Add one" onClick={() => add(p.id)} className="w-9 h-9 rounded-full border border-[var(--sand-tan)] flex items-center justify-center hover:bg-[var(--sand-tan)]/30">
                              <Plus size={16} />
                            </button>
                          </div>
                          <Ed as="span" id="store.product.incart" className="text-sm text-[var(--forest-green)]/60">in cart</Ed>
                        </div>
                      ) : (
                        <button
                          onClick={() => add(p.id)}
                          className="inline-flex w-full items-center justify-center h-11 px-6 bg-[var(--river-blue)] text-white rounded-full hover:bg-[var(--river-blue)]/90 transition-all duration-300"
                        >
                          <Ed as="span" id="store.product.add">Add to cart</Ed>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <Ed as="p" id="store.shop.loading" className="text-[var(--forest-green)]/60">Loading the store…</Ed>
              )}
            </div>

            {/* Cart */}
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto w-full" style={{ marginTop: '7rem' }}>
              <h4 className="mb-4 flex items-center gap-2"><ShoppingBag size={20} /> <Ed as="span" id="store.cart.title">Your Cart</Ed> {itemCount > 0 && <span className="text-sm text-[var(--forest-green)]/60">({itemCount})</span>}</h4>

              {cartLines.length === 0 ? (
                <Ed as="p" id="store.cart.empty" className="text-sm text-[var(--forest-green)]/60">Your cart is empty. Add some White Rock goods!</Ed>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cartLines.map((l) => (
                      <div key={l.product.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex-grow">
                          <div className="font-medium">{l.product.name}</div>
                          <div className="text-[var(--forest-green)]/60">{l.qty} × {dollars(l.product.priceCents)}</div>
                        </div>
                        <span className="whitespace-nowrap">{dollars(l.product.priceCents * l.qty)}</span>
                        <button aria-label="Remove item" onClick={() => removeItem(l.product.id)} className="text-[var(--forest-green)]/40 hover:text-[var(--forest-green)]">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Fulfillment */}
                  <div className="border-t border-[var(--sand-tan)] pt-4 mb-4">
                    <Ed as="p" id="store.cart.getby" className="text-sm font-medium mb-2">Get it by</Ed>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFulfillment('pickup')}
                        className={`h-10 rounded-lg border text-sm ${fulfillment === 'pickup' ? 'border-[var(--river-blue)] bg-[var(--river-blue)]/10 text-[var(--river-blue)]' : 'border-[var(--sand-tan)]'}`}
                      ><Ed as="span" id="store.cart.pickup">Store pickup</Ed></button>
                      <button
                        onClick={() => setFulfillment('ship')}
                        className={`h-10 rounded-lg border text-sm ${fulfillment === 'ship' ? 'border-[var(--river-blue)] bg-[var(--river-blue)]/10 text-[var(--river-blue)]' : 'border-[var(--sand-tan)]'}`}
                      ><Ed as="span" id="store.cart.ship">Ship to me</Ed></button>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="text-sm space-y-1 mb-4">
                    <div className="flex justify-between"><Ed as="span" id="store.cart.subtotal">Subtotal</Ed><span>{dollars(subtotalCents)}</span></div>
                    {taxCents > 0 && (
                      <div className="flex justify-between"><Ed as="span" id="store.cart.tax">PA sales tax (6%)</Ed><span>{dollars(taxCents)}</span></div>
                    )}
                    <div className="flex justify-between">
                      <Ed as="span" id="store.cart.shipping">Shipping</Ed>
                      <span>{fulfillment === 'ship' ? dollars(shippingCents) : 'Free (pickup)'}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base border-t border-[var(--sand-tan)] pt-2 mt-2">
                      <Ed as="span" id="store.cart.total">Total</Ed><span>{dollars(totalCents)}</span>
                    </div>
                  </div>

                  {error && <div className="text-sm text-[#b23b3b] mb-3">{error}</div>}

                  <button
                    onClick={checkout}
                    disabled={checkingOut}
                    className="inline-flex w-full items-center justify-center h-12 px-6 bg-[var(--forest-green)] text-white rounded-full hover:bg-[var(--forest-green)]/90 transition-all duration-300 disabled:opacity-60"
                  >
                    {checkingOut ? <Ed as="span" id="store.checkout.loading">Redirecting to secure checkout…</Ed> : <Ed as="span" id="store.checkout.btn">Checkout</Ed>}
                  </button>
                  <p className="text-xs text-[var(--forest-green)]/60 text-center mt-3">
                    <Ed as="span" id="store.cart.secure">Secure payment by Stripe.</Ed> {fulfillment === 'ship' ? 'Shipping address collected at checkout.' : 'Pick up at Johnetta Supply.'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pickup & shipping */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Ed as="h2" id="store.pickup.title" className="mb-4">Pickup or Shipping</Ed>
            <Ed as="p" id="store.pickup.sub" className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">Two easy ways to get your gear.</Ed>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[var(--sand-tan)]/30 rounded-lg p-8 text-center">
              <StoreIcon size={48} className="mx-auto mb-4 text-[var(--river-blue)]" />
              <Ed as="h4" id="store.pickup.card1.title" className="mb-3">Store Pickup</Ed>
              <Ed as="p" id="store.pickup.card1.desc" className="text-[var(--forest-green)]/70">Pay online and grab your order at Johnetta Supply when you're on the trails or checking in — no shipping cost.</Ed>
            </div>
            <div className="bg-[var(--sand-tan)]/30 rounded-lg p-8 text-center">
              <Truck size={48} className="mx-auto mb-4 text-[var(--river-blue)]" />
              <Ed as="h4" id="store.pickup.card2.title" className="mb-3">Shipped to You</Ed>
              <Ed as="p" id="store.pickup.card2.desc" className="text-[var(--forest-green)]/70">Can't make it out? Choose shipping at checkout and we'll send your gear anywhere in the U.S.</Ed>
            </div>
          </div>
        </div>
      </section>

      {/* Store gallery */}
      <section className="py-16 px-4 bg-[var(--sand-tan)]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Ed as="p" id="store.gallery.eyebrow" className="uppercase tracking-widest text-[var(--river-blue)] mb-3">Gallery</Ed>
            <Ed as="h2" id="store.gallery.title" className="mb-4">Inside the Store</Ed>
            <Ed as="p" id="store.gallery.sub" className="text-xl text-[var(--forest-green)]/70 max-w-3xl mx-auto">A look around Johnetta Supply and the trails it sits on.</Ed>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GALLERY.map((src, i) => (
              <div key={i} className="rounded-lg overflow-hidden shadow-md aspect-square">
                <img src={src} alt={`Johnetta Supply gallery ${i + 1}`} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[var(--forest-green)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Ed as="h2" id="store.cta.title" className="text-white mb-6">Stop by on the Trails</Ed>
          <Ed as="p" id="store.cta.sub" className="text-xl mb-8 text-white/90">Riding the Armstrong Trails or staying the weekend? Swing by Johnetta Supply — or order your gear online for pickup or shipping.</Ed>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton variant="secondary" onClick={() => onNavigate('trail')} className="h-12 px-8"><Ed as="span" id="store.cta.explore">Explore the Trails</Ed></CTAButton>
            <a
              href={`tel:${PHONE_TEL}`}
              className="inline-flex items-center justify-center h-12 px-8 bg-white text-[var(--forest-green)] rounded-full hover:bg-[var(--sand-tan)] transition-all duration-300 hover:shadow-lg"
            >
              <Ed as="span" id="store.cta.call">Call:</Ed> {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
