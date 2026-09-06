import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

/**
 * Interactive Google map for the Marina page. Renders the Allegheny River around
 * White Rock Station with the marina plus real, public river access points.
 *
 * Uses the Google Maps JavaScript API with the same key as the Contact page
 * (VITE_GOOGLE_MAPS_API_KEY). Locations are geocoded by Google at load time, so
 * pins are placed by Google rather than hard-coded coordinates. If the key is
 * missing or the map fails to load, a graceful fallback is shown.
 */

type PlaceType = 'marina' | 'launch' | 'water';

interface Place {
  name: string;
  query: string; // address / place name that Google geocodes
  type: PlaceType;
  desc: string;
}

// Real, public access points on/near the Allegheny River around Kittanning, PA.
const PLACES: Place[] = [
  {
    name: 'White Rock Station Marina',
    query: '395 Silvis Hollow Rd, Kittanning, PA 16201',
    type: 'marina',
    desc: 'Our riverfront marina — boat slips, fuel dock, and launch.',
  },
  {
    name: 'Kittanning Riverfront Park',
    query: 'Kittanning Riverfront Park, Kittanning, PA',
    type: 'launch',
    desc: 'Public boat ramp and riverfront access in downtown Kittanning.',
  },
  {
    name: 'Rosston Access',
    query: 'Rosston Access Area, Kittanning, PA 16201',
    type: 'launch',
    desc: 'PA Fish & Boat Commission access to the Allegheny River and Crooked Creek.',
  },
  {
    name: 'Crooked Creek Lake',
    query: 'Crooked Creek Lake, Ford City, PA',
    type: 'water',
    desc: 'Boating, kayaking, and fishing at the Crooked Creek Recreation Area.',
  },
  {
    name: 'Cowanshannock Creek Access',
    query: 'Cowanshannock Creek, Rural Valley, PA',
    type: 'launch',
    desc: 'Upstream creek-mouth access to the Allegheny.',
  },
  {
    name: 'Freeport Access',
    query: 'Freeport Boat Launch, Freeport, PA',
    type: 'launch',
    desc: 'Downstream public launch on the Allegheny River.',
  },
];

const COLORS: Record<PlaceType, string> = {
  marina: '#2e5d3f', // forest green — the resort
  launch: '#3a6b8c', // river blue — boat launches / access
  water: '#a9733f', // tan — lakes / fishing & recreation
};

const LEGEND: { type: PlaceType; label: string }[] = [
  { type: 'marina', label: 'White Rock Station' },
  { type: 'launch', label: 'Boat launch / access' },
  { type: 'water', label: 'Fishing & recreation' },
];

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(key: string): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

function markerIcon(type: PlaceType, g: any) {
  return {
    path: g.maps.SymbolPath.CIRCLE,
    fillColor: COLORS[type],
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: type === 'marina' ? 11 : 8,
  };
}

export function RiverMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'nokey'>('loading');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const areaLink =
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Allegheny River, Kittanning, PA');

  useEffect(() => {
    if (!apiKey) {
      setStatus('nokey');
      return;
    }
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const g = (window as any).google;

        const map = new g.maps.Map(mapRef.current, {
          center: { lat: 40.78, lng: -79.52 },
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative',
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        });

        const geocoder = new g.maps.Geocoder();
        const bounds = new g.maps.LatLngBounds();
        const info = new g.maps.InfoWindow();
        let settled = 0;

        PLACES.forEach((place) => {
          geocoder.geocode({ address: place.query }, (results: any, gcStatus: string) => {
            if (gcStatus === 'OK' && results && results[0]) {
              const pos = results[0].geometry.location;
              const marker = new g.maps.Marker({
                map,
                position: pos,
                title: place.name,
                icon: markerIcon(place.type, g),
              });
              marker.addListener('click', () => {
                info.setContent(
                  `<div style="max-width:220px;font-family:inherit">
                     <div style="font-weight:600;color:${COLORS[place.type]};margin-bottom:4px">${place.name}</div>
                     <div style="font-size:13px;line-height:1.4;color:#3b4a3f">${place.desc}</div>
                   </div>`
                );
                info.open(map, marker);
              });
              bounds.extend(pos);
            }
            settled += 1;
            if (settled === PLACES.length && !bounds.isEmpty()) {
              map.fitBounds(bounds, 48);
            }
          });
        });

        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // Fallback when there's no key or the map can't load.
  if (status === 'nokey' || status === 'error') {
    return (
      <div className="bg-[var(--sand-tan)]/30 rounded-lg p-12 text-center">
        <MapPin size={48} className="mx-auto mb-4 text-[var(--river-blue)]" />
        <h4 className="mb-2">River Access Map</h4>
        <p className="text-[var(--forest-green)]/70 mb-4">
          Explore boat launches, fishing access, and the Allegheny River around Kittanning.
        </p>
        <a
          href={areaLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--river-blue)] hover:underline"
        >
          Open the river map in Google Maps →
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="relative rounded-lg overflow-hidden shadow-md" style={{ height: 460 }}>
        <div ref={mapRef} className="w-full bg-[var(--sand-tan)]/30" style={{ height: '100%' }} />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <MapPin size={40} className="mx-auto mb-2 text-[var(--river-blue)] animate-pulse" />
              <p className="text-sm text-[var(--forest-green)]/70">Loading river map…</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {LEGEND.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: COLORS[item.type] }}
            />
            <span className="text-sm text-[var(--forest-green)]/80">{item.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-sm text-[var(--forest-green)]/60">
        Tap a marker for details. Access points are public launches maintained by the
        PA Fish &amp; Boat Commission and local agencies.
      </p>
    </div>
  );
}
