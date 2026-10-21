# public/video/

Place two files here before deploying:

1. `hero.mp4`   — compressed video (target < 8 MB, no audio)
2. `hero-poster.jpg` — single frame from the video (used as fallback poster)

## How to create them (ffmpeg, run after confirming the video licence)

```bash
# Compress original to web-friendly size
ffmpeg -i hero-original.mp4 -vf "scale=1280:-2" -an -c:v libx264 -crf 28 -preset slow -movflags +faststart hero.mp4

# Extract poster frame
ffmpeg -i hero.mp4 -frames:v 1 hero-poster.jpg
```

## Licence note

Before the site is public, confirm the video's licence allows use on a public website
and whether credit is required. Record the answer in `docs/DECISIONS.md`.

## Temporary (dev) source

During development the video is served from VITE_LANDING_VIDEO_URL in your .env.local.
The app uses this env var at runtime — do NOT hard-code the URL in source files.
