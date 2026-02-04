'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  imageUrl?: string;
  title: string;
  subtitle: string;
}

export function HeroSection({ imageUrl, title, subtitle }: HeroSectionProps) {

  const handleShopNowClick = () => {
    const productsSection = document.getElementById('products');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <section className="relative h-[60vh] w-full flex items-center justify-center text-center text-white" aria-labelledby="hero-title">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={`Luxury background visual for ${title}`}
          fill
          priority
          className="object-cover"
          data-ai-hint="luxury abstract"
        />
      )}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="relative z-10 p-4">
        <h2 id="hero-title" className="text-5xl md:text-7xl font-extrabold font-headline text-primary animate-gold-pulse">
          {title}
        </h2>
        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
          {subtitle}
        </p>
        <Button size="lg" className="mt-8 h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={handleShopNowClick}>
          Shop Now
        </Button>
      </div>
    </section>
  );
}
