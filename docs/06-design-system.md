# SAIRA: Design System

Two moods, one brand: a **cinematic landing/login** (from the learner's inspiration prompt) and a **fast, focused dark dashboard** for the sheet. The video never appears behind the working screens.

## 1. Brand

- Name: **SAIRA** · tagline "since 2026".
- Mark: `brand/saira-mark.svg` (purple→pink gradient **S** with two opposing arrows, on `#161618`). Icons are rendered in `brand/` (192, 512, 180 apple-touch, 32 favicon).
- Gradient: `--brand-from: #8B3DFF` → `--brand-to: #FF2E7E` (135°).
- Wordmark: "SAIRA" in Inter 600, tracking `0.18em`, uppercase; "SINCE 2026" in Inter 500, tracking `0.32em`, small. Use the gradient on the mark, solid white/pink on the wordmark.
- Also produce `maskable-512.png` (mark scaled to the inner 80% safe zone on solid `#161618`) for the manifest.

## 2. Tokens (CSS variables, HSL for shadcn)

App (dashboard) theme: neutral near-black surfaces with the brand gradient as accent.
```css
:root {
  --background: 240 5% 8%;          /* #131315 */
  --surface: 240 5% 11%;            /* cards */
  --surface-2: 240 5% 14%;          /* raised / hover */
  --foreground: 0 0% 96%;
  --muted-foreground: 240 5% 66%;
  --border: 240 4% 20%;
  --input: 240 4% 20%;
  --ring: 270 100% 70%;
  --primary: 270 100% 62%;          /* violet, buttons/links */
  --primary-foreground: 0 0% 100%;
  --accent-pink: 337 100% 59%;      /* #FF2E7E */
  --success: 152 60% 45%;
  --warning: 38 95% 55%;
  --danger: 0 80% 60%;
  --radius: 0.75rem;
  --font-display: 'Instrument Serif', serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```
Landing/login theme (from the inspiration prompt): `--background: 201 100% 13%` (deep navy), `--foreground: 0 0% 100%`, `--muted-foreground: 240 4% 66%`, `--primary: 0 0% 100%`, `--primary-foreground: 0 0% 4%`, `--secondary/--muted/--accent: 0 0% 10%`, `--border/--input: 0 0% 18%`. Scope it with a `.theme-cinematic` class on the landing/login layout so the app theme is untouched.

### Phase accents (clear distinction between sections)
| Phase | Name | Accent (HSL) | Use |
|---|---|---|---|
| 0 | Programming and Java foundations | `199 90% 60%` sky | bar, ring, left border of cards, chip |
| 1 | Complexity and math | `38 95% 58%` amber | same |
| 2 | Core structures and techniques | `262 85% 68%` violet | same |
| 3 | Linked structures and trees | `152 60% 48%` emerald | same |
| 4 | Graphs and dynamic programming | `345 85% 62%` rose | same |
| 5 | Advanced and optional | `186 70% 50%` cyan | same |
Each phase card gets a 3 px accent left border and a faint (6–8%) accent tint. Accent text on dark must still meet 4.5:1; otherwise use foreground text with an accent chip.

Source tag chips: `K` = blue-grey, `S` = orange, `+` = neutral outline. Status chips: not started (muted), in progress (amber), done (green), needs revision (pink).

## 3. Typography

- Display (landing hero, greeting, daily quote): **Instrument Serif**, weight 400, tight tracking, `leading-[0.95]` on hero.
- UI/body: **Inter** 400/500/600. Numbers in stats: Inter tabular-nums. Code/ids/times: JetBrains Mono.
- Scale: 12 / 14 / 16 / 20 / 28 / 40; hero up to `text-8xl`.

## 4. Landing and login (cinematic)

Follow the learner's inspiration prompt, rebranded as SAIRA:
- Fullscreen `<video autoPlay loop muted playsInline>` with `absolute inset-0 w-full h-full object-cover z-0`, source from `VITE_LANDING_VIDEO_URL`. Add a `poster` and a dark gradient fallback; pause under `prefers-reduced-motion` or data-saver; `preload="metadata"` on mobile.
- Nav (`relative z-10`, `max-w-7xl mx-auto px-8 py-6`): logo "SAIRA" (use the mark + wordmark, ® not needed), links Home · Sheet · Progress · About (muted, hover to foreground), CTA "Start today" using `.liquid-glass`.
- Hero: centered, `pt-32 pb-40`. H1 in Instrument Serif `text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px]`, e.g. **"Where dreams rise through the daily reps."**, with "dreams" and "through the daily reps." in `<em className="not-italic text-muted-foreground">`.
- Subtext (`text-muted-foreground text-base sm:text-lg max-w-2xl mt-8`): "A quiet place to learn data structures and algorithms. One sheet, one streak, one gentle nudge a day."
- CTA: "Continue with Google" (`.liquid-glass rounded-full px-14 py-5 hover:scale-[1.03]`).
- Animations: `fade-rise` keyframes and the three delay classes exactly as in the inspiration prompt.
- No blobs, radial gradients or extra overlays; the video gives the depth. Keep text contrast safe with a subtle uniform `bg-black/20` scrim only if the video is bright.

```css
.liquid-glass{background:rgba(255,255,255,.01);background-blend-mode:luminosity;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border:none;box-shadow:inset 0 1px 1px rgba(255,255,255,.1);position:relative;overflow:hidden}
.liquid-glass::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.4px;background:linear-gradient(180deg,rgba(255,255,255,.45) 0%,rgba(255,255,255,.15) 20%,rgba(255,255,255,0) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,.15) 80%,rgba(255,255,255,.45) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
@keyframes fade-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.animate-fade-rise{animation:fade-rise .8s ease-out both}
.animate-fade-rise-delay{animation:fade-rise .8s ease-out .2s both}
.animate-fade-rise-delay-2{animation:fade-rise .8s ease-out .4s both}
```

## 5. App shell and key components

- **App shell**: top bar + left rail (desktop) / bottom tab bar (mobile: Today, Sheet, Revision, Progress, Settings).
- **Cards**: `surface` bg, 1 px `border`, radius 12–16, soft inner highlight (`inset 0 1px 0 rgba(255,255,255,.04)`).
- **Progress ring** and **thin bars**: gradient or phase accent; animate on change (≤ 400 ms), no animation under reduced motion.
- **Heatmap**: 7×52 grid, 5 intensity steps of the brand violet; tooltip shows date + counts.
- **Streak flame**: small SVG with a subtle glow when today is already active.
- **Quote card**: Instrument Serif at 28 px on a subtle brand-gradient border; actions ♥ / another / copy.
- **Toasts** bottom-centre with Undo.
- Motion: 150–250 ms ease-out; never block input.

## 6. The coach (animated avatar)

- Component `<Coach state="idle|talking|cheer">`. A woman, friendly and professional, flat illustration style, three expressions.
- Asset plan: `public/coach/coach-idle.webp`, `coach-talk.webp` (open mouth), optionally `coach-cheer.webp`; 512×512 transparent. If real art isn't available the agent generates a clean flat SVG illustration placeholder in the brand palette (not a photo of a real person) and keeps the component API stable so art can be swapped.
- Overlay card slides in from bottom-right (desktop) or bottom sheet (mobile): avatar left, line text right, buttons **Start**, **Snooze 15 min**, **Not today**. While speaking, swap idle/talk frames every ~180 ms and show a soft glow ring. Auto-dismiss after 60 s (counts as dismissed).
- Voice: `speechSynthesis`, prefer an `en-IN` voice then any `en-*` female-sounding voice; rate 0.95. Lines from `data/avatar-lines.seed.json`.

## 7. Accessibility

AA contrast, 44 px targets, visible focus ring (`--ring`), `aria-live="polite"` for toasts and the coach text, `prefers-reduced-motion` honoured everywhere, never rely on colour alone (phase chips also show text/number).
