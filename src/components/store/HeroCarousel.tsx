import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBanners } from '@/services/store';
import { DEMO_BANNERS } from '@/lib/demoData';
import type { Banner } from '@/types';

export const HeroCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>(DEMO_BANNERS);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    getBanners()
      .then((data) => {
        if (data && data.length > 0) {
          setBanners(data);
        }
      })
      .catch((err) => console.warn('Could not fetch banners:', err));
  }, []);

  // Auto advance every 6s
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const currentBanner = banners[currentIndex] || DEMO_BANNERS[0]!;

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-neutral-950 via-neutral-900 to-stone-900 text-white py-12 md:py-20 lg:py-24 border-b border-amber-500/20">
      {/* Decorative Golden Ambient Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-brand-red/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[420px]">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-red/15 border border-brand-red/40 text-brand-red text-xs font-bold tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 animate-pulse text-brand-red" />
              <span>Premium Collection 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-heading leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-brand-gold to-yellow-500">
                {currentBanner.title}
              </span>
            </h1>

            {currentBanner.subtitle && (
              <p className="text-base sm:text-xl font-medium text-gray-200 tracking-wide">
                {currentBanner.subtitle}
              </p>
            )}

            {currentBanner.description && (
              <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {currentBanner.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link to={currentBanner.cta_url || '/shop'}>
                <Button className="bg-brand-red hover:bg-brand-red-dark text-white font-bold px-8 py-6 rounded-md shadow-lg shadow-red-900/50 text-base flex items-center gap-2 transition-all transform hover:-translate-y-0.5 hover:shadow-xl">
                  <span>{currentBanner.cta_text || 'Shop Now'}</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/offers">
                <Button
                  variant="outline"
                  className="border-amber-400/40 text-amber-200 hover:text-white hover:border-brand-gold hover:bg-brand-gold/20 px-6 py-6 text-base font-semibold transition"
                >
                  View Offers
                </Button>
              </Link>
            </div>

            {/* Quick trust perks */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-gold" />
                <span>100% Authentic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-brand-gold">★</span>
                <span>Fast Express Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-brand-gold">৳</span>
                <span>Cash on Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Showcase Photography */}
          <div className="lg:col-span-5 flex justify-center items-center relative">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-3xl bg-gradient-to-br from-neutral-800/90 via-neutral-900/90 to-stone-950/95 border-2 border-brand-gold/30 p-6 flex items-center justify-center shadow-2xl backdrop-blur-md group overflow-hidden">
              {/* Golden circular glow behind image */}
              <div className="absolute inset-0 bg-radial from-brand-gold/20 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition duration-700" />
              
              <img
                src={currentBanner.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'}
                alt={currentBanner.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80';
                }}
                className="max-h-72 max-w-full object-contain filter drop-shadow-[0_20px_35px_rgba(212,175,55,0.4)] transition-transform duration-700 group-hover:scale-110"
              />

              {/* Genuine product badge */}
              <div className="absolute top-4 right-4 bg-black/60 border border-brand-gold/40 text-brand-gold font-bold text-[11px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider backdrop-blur-sm">
                Shop Beyond Time
              </div>

              <div className="absolute -bottom-1 -left-1 bg-gradient-to-r from-brand-red to-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-tr-xl shadow-lg uppercase tracking-wider">
                Official Collection
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-brand-red border border-white/20 hover:border-brand-red text-white flex items-center justify-center transition-all backdrop-blur-md z-20 shadow-lg"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-brand-red border border-white/20 hover:border-brand-red text-white flex items-center justify-center transition-all backdrop-blur-md z-20 shadow-lg"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 transition-all rounded-full ${
                  idx === currentIndex ? 'w-9 bg-brand-red' : 'w-2.5 bg-gray-600 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
