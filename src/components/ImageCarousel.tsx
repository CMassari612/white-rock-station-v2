import { useState, useEffect } from 'react';

interface ImageCarouselProps {
  images: string[];
  autoRotateInterval?: number; // in milliseconds
}

export function ImageCarousel({ images, autoRotateInterval = 4000 }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [images.length, autoRotateInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const getImageIndex = (offset: number) => {
    return (currentIndex + offset + images.length) % images.length;
  };

  if (images.length === 0) return null;

  // Always show exactly 3 images
  const displayImages = images.slice(0, 3);
  if (displayImages.length < 3) {
    // Duplicate images if we have less than 3
    while (displayImages.length < 3) {
      displayImages.push(...images);
    }
    displayImages.splice(3);
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="relative flex items-center justify-center gap-4 px-8 py-8">
        {/* Left Image - Much Smaller */}
        <button
          onClick={goToPrevious}
          className="flex-shrink-0 w-[12%] h-[40%] overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer opacity-70 hover:opacity-85 self-center"
          aria-label="Previous image"
        >
          <img
            src={displayImages[getImageIndex(-1)]}
            alt={`Previous image`}
            className="w-full h-full object-cover"
          />
        </button>

        {/* Center Image - Large (Elevated) */}
        <div className="flex-shrink-0 w-[76%] aspect-video overflow-hidden rounded-lg shadow-2xl transition-all duration-300 z-10">
          <img
            src={displayImages[currentIndex]}
            alt={`Current image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Image - Much Smaller */}
        <button
          onClick={goToNext}
          className="flex-shrink-0 w-[12%] h-[40%] overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer opacity-70 hover:opacity-85 self-center"
          aria-label="Next image"
        >
          <img
            src={displayImages[getImageIndex(1)]}
            alt={`Next image`}
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </div>
  );
}
