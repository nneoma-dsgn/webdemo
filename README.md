# Circo Web (prototype)

Clickable web prototype of Circo, adapted from the mobile designs in Figma
(file `Circo Mobile Designs`, pages *Revised Feed & Navigation* and *SSO SIGN UP - USER*).
Layout patterns take cues from Netflix and Apple TV.

## Run

```bash
npm install
npm run dev     # http://localhost:5180
npm run build && npm start
```

Next.js (App Router) + React + TypeScript. Styling is plain CSS with design tokens in
`src/styles/tokens.css`, mirrored from the Figma variables.

## Structure

| Path | What |
| --- | --- |
| `src/app/` | Routes. `(app)/` holds signed-in pages (Home, Search, Studio, Browse) behind `RequireAuth`; `welcome`, `signup`, `login`, `onboarding` are the signed-out flow. |
| `src/views/` | Page components rendered by the routes. |
| `src/components/` | Shared UI: top/phone nav, rails (`Shelf`), cards, hover preview (`Preview`), landing "Now on Circo" (`Theater`), hero trailer (`HeroVideo`), toast/menu. |
| `src/data/catalog.ts` | All content: titles, shelves per tab, trailers, studios. |
| `src/auth.ts` | Mock session in `localStorage`. |
| `public/assets` | Assets exported from Figma (logo, icons, avatar). |
| `public/media` | Preview posters and backdrops from TMDB. |

## Prototype-only (replace for production)

- **Auth is mocked.** Google/Apple buttons and the Google account chooser are front-end stand-ins;
  the session is a `localStorage` flag and route guards run on the client
  (`src/components/Guards.tsx`). Real auth should use a cookie session with middleware so pages can
  render on the server.
- **Content is hard-coded** in `src/data/catalog.ts`; posters/backdrops come from TMDB for
  preview only.
- **Trailers are YouTube embeds**, cropped and scaled to hide YouTube chrome. YouTube still shows a
  small start indicator and takes ~1-2s to begin. Production should stream Circo's own video
  (e.g. HLS), which removes both.
- **Not wired up:** the video player (Watch Now buttons are inert), Library, title pages, wallet,
  device linking (QR is decorative), payments.
