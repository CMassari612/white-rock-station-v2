import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    location: 'Pittsburgh, PA',
    rating: 5,
    text: 'White Rock Station is our family\'s favorite getaway! The cabins are clean and cozy, and the riverfront location is absolutely beautiful. We\'ll be back every summer!',
  },
  {
    id: 2,
    name: 'Mike Patterson',
    location: 'Cleveland, OH',
    rating: 5,
    text: 'Perfect spot for trail enthusiasts! Direct access to the Armstrong Trail made our biking trip unforgettable. The marina and facilities are top-notch.',
  },
  {
    id: 3,
    name: 'Jennifer Lee',
    location: 'Erie, PA',
    rating: 5,
    text: 'We stayed in a large cabin for a weekend retreat and it exceeded all expectations. Great amenities, beautiful surroundings, and wonderful staff. Highly recommend!',
  },
];

export function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 max-w-4xl mx-auto">
      <div className="flex justify-center mb-6">
        {[...Array(current.rating)].map((_, i) => (
          <Star key={i} size={24} className="fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      
      <p className="text-center text-xl text-[var(--forest-green)] mb-6 italic">
        "{current.text}"
      </p>
      
      <div className="text-center mb-6">
        <p className="text-[var(--warm-brown)]">{current.name}</p>
        <p className="text-[var(--forest-green)]/60 text-sm">{current.location}</p>
      </div>

      <div className="flex justify-center items-center space-x-4">
        <button
          onClick={prev}
          className="w-10 h-10 bg-[var(--sand-tan)] rounded-full flex items-center justify-center hover:bg-[var(--warm-brown)] hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-[var(--river-blue)]' : 'bg-[var(--sand-tan)]'
              }`}
            />
          ))}
        </div>
        
        <button
          onClick={next}
          className="w-10 h-10 bg-[var(--sand-tan)] rounded-full flex items-center justify-center hover:bg-[var(--warm-brown)] hover:text-white transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
