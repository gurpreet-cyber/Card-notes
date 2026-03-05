# Card Notes — GitHub Pages PWA

A beautiful card-based notes app. Installable as a PWA on iOS and Android.

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `card-notes`)
2. Upload all files from this folder to the repository root
3. Go to **Settings → Pages**
4. Under **Source**, select **Deploy from a branch**
5. Choose **main** branch, **/ (root)** folder → click **Save**
6. Wait ~1 minute, then visit: `https://YOUR_USERNAME.github.io/card-notes/`

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell — loads React from CDN |
| `app.js` | Pre-compiled app (no Babel needed) |
| `manifest.json` | PWA install metadata |
| `sw.js` | Service worker for offline support |
| `icon-192.png` | App icon (192×192) |
| `icon-512.png` | App icon (512×512) |
| `splash.png` | iOS launch screen |

## Install as app

- **iPhone/iPad**: Open in Safari → Share → Add to Home Screen
- **Android**: Open in Chrome → menu → Add to Home Screen
- **Desktop**: Click the install icon in the Chrome address bar

## Features

- Card-based notes with swipe navigation
- 51 themes with per-card color palettes
- Markdown: `# H1`, `## H2`, `### H3`, `* bullet`, `1. numbered list`
- Export cards as images
- Works fully offline after first load
