# SAIRA: Landing and Login Hero Spec

Save as `docs/10-landing-hero-spec.md`. Build this in **Milestone 7** (landing page). The visual reference is `docs/reference/SAIRA.html`. Match its look, but rebuild in React, TypeScript, Tailwind and shadcn/ui. Do not copy its plain-JavaScript code or its sample data.

## 1. Where video is allowed

- The fullscreen video appears **only** on the landing page and the login page.
- The dashboard (Today, Sheet, Progress, Revision, Settings) has **no video**. It stays fast, dark and neutral (`#121214` family, see `06-design-system.md`).
- The landing hero uses the deep navy theme below. The dashboard does not.

## 2. Stack and files

React + Vite + TypeScript + Tailwind CSS + shadcn/ui. Suggested files: `src/pages/Landing.tsx`, `src/components/HeroVideo.tsx`, `src/components/GlassNav.tsx`, and the glass and animation CSS in `src/index.css`.

## 3. Fonts

Google Fonts: **Instrument Serif** (display) and **Inter** weights 400 and 500 (body). The correct name is "Instrument Serif", not "Instrumental".

```css
:root { --font-display: 'Instrument Serif', serif; --font-body: 'Inter', sans-serif; }
body { font-family: var(--font-body); }
```
Headings use `fontFamily: "'Instrument Serif', serif"`.

## 4. Landing colour tokens (HSL, dark only)

```
--background: 201 100% 13%;      /* deep navy */
--foreground: 0 0% 100%;
--muted-foreground: 240 4% 66%;
--primary: 0 0% 100%;  --primary-foreground: 0 0% 4%;
--secondary: 0 0% 10%; --muted: 0 0% 10%; --accent: 0 0% 10%;
--border: 0 0% 18%;    --input: 0 0% 18%;
```
Brand violet-to-pink is used for the logo and progress only.

## 5. Video

- A `<video>` with `autoPlay loop muted playsInline`, classes `absolute inset-0 w-full h-full object-cover z-0`.
- **Source:** read from `VITE_LANDING_VIDEO_URL`.
  - Final value: `/video/hero.mp4` (self-hosted in `public/video/`).
  - Temporary value until the licence check is done: the CloudFront link already in `.env.example`.
- **Poster (required):** `poster="/video/hero-poster.jpg"`. If the video fails to load, the user must see the poster over the navy background, never a blank blue screen.
- **Reduced motion:** if `prefers-reduced-motion: reduce`, do not autoplay. Show the poster only.
- **Performance:** the video file must be small (target under about 8 MB, no audio). Do not load it on dashboard routes.
- **Autoplay safety:** call `video.play()` inside a `catch` so a blocked autoplay never throws.
- No overlays, blobs or radial gradients on top of the video. The video provides the depth.

Prepare the files (learner runs these, after confirming the video's licence):
```
ffmpeg -i hero-original.mp4 -vf "scale=1280:-2" -an -c:v libx264 -crf 28 -preset slow -movflags +faststart hero.mp4
ffmpeg -i hero.mp4 -frames:v 1 hero-poster.jpg
```

## 6. Glass navigation (public, unauthenticated)

The nav on `/` and `/login` is intentionally minimal — signed-out visitors
must not see application routes they cannot access.

- Container: `relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto`.
- **Left**: SAIRA mark + wordmark. Clicking goes to `/`.
- **Right**: a single **Sign in** button using `.liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:scale-[1.03]`. Clicking it opens the Google sign-in popup directly.
- **No other links** (Home, Sheet, Progress, Reminders are hidden until the user is signed in). The app navigation (top bar + bottom tab bar inside AppShell) only appears after sign-in.

## 7. Hero

- Container: `relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-40`, vertically centred in a full-height section.
- **H1:** "Where **dreams** rise **through the daily reps.**" with classes `text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal` and Instrument Serif. Wrap "dreams" and "through the daily reps." in `<em className="not-italic text-muted-foreground">`. Add `animate-fade-rise`.
- **Subtext:** "A quiet place to learn data structures and algorithms. One sheet, one streak, one gentle nudge a day." Classes `text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay`.
- **CTA:** **Continue with Google**, `liquid-glass rounded-full px-14 py-5 text-base text-foreground mt-12 hover:scale-[1.03] cursor-pointer animate-fade-rise-delay-2`. It triggers the real Firebase Google sign-in. It must not skip sign-in (the reference file's skip-login behaviour is for preview only).
- Do not show the "Preview" note from the reference file.

## 8. Liquid glass CSS

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

## 9. Animations

```css
@keyframes fade-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-rise         { animation: fade-rise 0.8s ease-out both; }
.animate-fade-rise-delay   { animation: fade-rise 0.8s ease-out 0.2s both; }
.animate-fade-rise-delay-2 { animation: fade-rise 0.8s ease-out 0.4s both; }
@media (prefers-reduced-motion: reduce) { .animate-fade-rise, .animate-fade-rise-delay, .animate-fade-rise-delay-2 { animation: none; } }
```

## 10. Login page

Reuse the same video background, glass nav and fonts. Replace the hero with a centred glass card: SAIRA mark, one line of text, and the **Continue with Google** button. Show a clear error message if sign-in fails or is cancelled.

## 11. Acceptance checks

- Video plays on landing and login; with the video blocked, the poster and navy background show a designed screen.
- With reduced motion on, nothing autoplays or animates.
- No video request is made on dashboard routes (check the Network tab).
- Text is readable over the video (contrast check on the h1, subtext and nav).
- Layout works at 360 px width and at desktop width.
- Lighthouse performance on the landing page is reported honestly in `docs/PROGRESS.md`.
- The Content-Security-Policy in `firebase.json` allows the video source you actually use.

## 12. Licence note for the learner

Before the site is public, confirm the video's licence allows use on a public website and whether credit is required. Record the answer in `docs/DECISIONS.md`. If it does not allow it, replace the video with a licensed clip or a still-image background. Nothing else changes.
