import React, { useEffect, useRef } from 'react';

/**
 * Default to the self-hosted file.
 * VITE_LANDING_VIDEO_URL is optional: set it in .env.local to override
 * (e.g. a CDN URL for a different clip). When not set, /video/hero.mp4
 * is used directly.
 */
const VIDEO_SRC: string =
  (import.meta.env.VITE_LANDING_VIDEO_URL as string | undefined) || '/video/hero.mp4';
const POSTER_URL = '/video/hero-poster.jpg';

/**
 * Full-bleed cinematic video background.
 * - Defaults to /video/hero.mp4 (self-hosted in public/video/).
 * - VITE_LANDING_VIDEO_URL overrides the source when set.
 * - poster=/video/hero-poster.jpg is always set; shows if video is blocked.
 * - prefers-reduced-motion: reduce → video is NOT played; poster visible only.
 * - data-saver: also skips autoplay when Save-Data header is present.
 * - play() is called inside useEffect with .catch() — blocked autoplay never throws.
 * - Only mounted on Landing / Login — never on dashboard routes.
 * - The /video/ folder is excluded from the service worker precache and runtime cache.
 */
export const HeroVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect reduced-motion and data-saver preferences
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const prefersDataSaver =
    typeof navigator !== 'undefined' &&
    // navigator.connection is not standard yet; cast to access it safely
    (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData === true;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion || prefersDataSaver) return;

    // Safe autoplay — .catch() prevents DOMException from bubbling
    video.play().catch(() => {
      /* autoplay blocked by browser policy — poster already visible */
    });
  }, [prefersReducedMotion, prefersDataSaver]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover z-0"
      src={VIDEO_SRC}
      poster={POSTER_URL}
      loop
      muted
      playsInline
      preload="metadata"
      // autoPlay intentionally omitted — play() in useEffect gives us the catch()
      aria-hidden="true"
    />
  );
};
