"use client";

import { useState, useEffect } from 'react';
import type { CarouselApi } from './ui/carousel';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';

interface CenterFocusCarouselProps {
  images: Array<{ src: string; alt?: string }>;
}

export function CenterFocusCarousel({ images }: CenterFocusCarouselProps) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelected(api.selectedScrollSnap());
    };

    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);

    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

  const getSlideStyle = (index: number) => {
    if (!api) return {};
    
    const totalSlides = api.scrollSnapList().length;
    const distance = Math.min(
      Math.abs(index - selected),
      Math.abs(index - selected + totalSlides),
      Math.abs(index - selected - totalSlides)
    );

    const isActive = distance === 0;
    const isNeighbor = distance === 1;

    if (isActive) {
      return {
        transform: 'scale(1.03)',
        opacity: 1,
        zIndex: 20,
      };
    } else if (isNeighbor) {
      return {
        transform: 'scale(0.94)',
        opacity: 0.7,
        zIndex: 10,
      };
    } else {
      return {
        transform: 'scale(0.90)',
        opacity: 0.4,
        zIndex: 0,
      };
    }
  };

  const handleSlideClick = (index: number) => {
    if (!api) return;
    
    const totalSlides = api.scrollSnapList().length;
    const distance = Math.min(
      Math.abs(index - selected),
      Math.abs(index - selected + totalSlides),
      Math.abs(index - selected - totalSlides)
    );

    const isNeighbor = distance === 1;
    if (isNeighbor) {
      if (index < selected || (index === totalSlides - 1 && selected === 0)) {
        api.scrollPrev();
      } else {
        api.scrollNext();
      }
    }
  };

  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: 'center',
        loop: true,
        containScroll: 'trimSnaps',
      }}
      className="w-full"
    >
      {/* Slightly smaller heights to avoid excessive vertical whitespace on the Lodging page */}
      <div className="relative w-full overflow-hidden rounded-2xl h-[240px] md:h-[320px] lg:h-[380px] px-6 md:px-10">
        <CarouselContent className="-ml-2 md:-ml-4">
          {images.map((image, index) => {
            const isActive = index === selected;
            const totalSlides = api?.scrollSnapList().length || images.length;
            const distance = api
              ? Math.min(
                  Math.abs(index - selected),
                  Math.abs(index - selected + totalSlides),
                  Math.abs(index - selected - totalSlides)
                )
              : Infinity;
            const isNeighbor = distance === 1;
            const cardHeight = isActive ? 'h-full' : isNeighbor ? 'h-[86%]' : 'h-[80%]';
            const styles = getSlideStyle(index);

            return (
              <CarouselItem
                key={index}
                className="pl-2 md:pl-4 h-full grow-0 shrink-0 basis-[62%] sm:basis-[54%] md:basis-[44%] lg:basis-[40%]"
              >
                <div
                  className={`relative w-full ${cardHeight} my-auto rounded-2xl overflow-hidden transition-all duration-300 ease-out cursor-pointer`}
                  style={styles}
                  onClick={() => handleSlideClick(index)}
                >
                  <img
                    src={image.src}
                    alt={image.alt || `Image ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none select-none"
                  />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </div>
    </Carousel>
  );
}
