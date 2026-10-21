import React, { useEffect, useRef } from 'react';

const VIDEO_URL = import.meta.env.VITE_LANDING_VIDEO_URL as string | undefined;
const POSTER_URL = '/video/hero-poster.jpg';

/**
 * Full-bleed cinematic video background.
 * - Reads source from VITE_LANDING_VIDEO_URL (never hard-coded).
 * - Falls back to the poster over the navy background when the video cannot load.
 * - Respects prefers-reduced-motion: does NOT autoplay under that condition.
 * - Catches blocked-autoplay errors silently (no console throw).
 * - Only mounted on Landing / Login — never on dashboard routes.
 */
export const HeroVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check reduced-motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion) return;

    // Safe autoplay — catch() prevents DOMException from bubbling
    video.play().catch(() => {
      /* autoplay blocked by browser policy — poster already visible */
    });
  }, [prefersReducedMotion]);

  if (!VIDEO_URL) {
    // No video URL configured: show a pure navy gradient fallback
    return (
      <div
        className="absolute inset-0 w-full h-full z-0"
        style={{ background: 'linear-gradient(160deg, hsl(201 100% 8%) 0%, hsl(201 100% 13%) 100%)' }}
        aria-hidden="true"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover z-0"
      src={VIDEO_URL}
      poster={POSTER_URL}
      loop
      muted
      playsInline
      preload="metadata"
      // autoPlay omitted: we call play() in useEffect so the catch works
      aria-hidden="true"
    />
  );
};
