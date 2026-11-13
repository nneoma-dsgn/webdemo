# Circo Web (prototype)

Clickable web prototype of Circo, adapted from the mobile designs in Figma
(file `Circo Mobile Designs`: *Revised Feed & Navigation*, *SSO SIGN UP - USER*, *Play Video*,
*Series*, *Account Settings*). Desktop layout patterns take cues from Netflix and Apple TV.

## Run

```bash
npm install
npm run dev        # http://localhost:5180 (phones on the same network: http://<your-ip>:5180)
npm run typecheck
npm run build && npm start
```

Next.js (App Router) + React + TypeScript. Styling is plain CSS with design tokens in
`src/styles/tokens.css`, mirrored from the Figma variables. The living style guide is at
`/design` (every token and shared component, rendered for real).

## Structure

| Path | What |
| --- | --- |
| `src/app/` | Routes. `(app)/` holds signed-in pages behind `RequireAuth` (Home, Explore, Search, Library, Account, Notifications, Studio, Browse "see all", Design); `welcome`, `signup`, `login` and `onboarding` are the signed-out flow; `watch/[id]` is the player. |
| `src/views/` | Page components rendered by the routes. |
| `src/components/ui.tsx` | Shared design-system components: `Text`, `Button` / `ButtonLink` (primary, secondary, accent, link; sm, md, lg), `Tag`, `Surface`, `SegmentedControl`, `List` / `ListRow`, `Disclosure` (a card that opens), `EmptyState`, `Dialog`, form fields. Styles in `src/styles/ui.css`. |
| `src/components/Icon.tsx` | Every line icon: one registry of named shapes and one `Icon` component (`size`, `weight`). |
| `src/components/` | Everything else shared: top bar, phone nav and Get the app bar (`Nav`), menus and phone bottom sheets (`Menu`), notifications (`Notifications`), Continue Watching (`ContinueWatching`, on Home, Explore and Library), the phone cast scanner (`CastScanner`), rails and cards, hover preview, hero trailer, the landing "Now on Circo" theater, checkout (`Access`). |
| `src/components/viewport.ts` | The phone breakpoint (`max-width: 767px`) for script. The stylesheets use the same value in their `@media` blocks. |
| `src/data/` | Mock content and state: `catalog.ts` (titles, shelves, trailers, studios, episodes, icons), `explore.ts`, `viewing.ts` (progress, passes, balance, quality), `payments.ts`, `notifications.ts`, saved, reminders, moderation. |
| `src/auth.ts` | Mock session in `localStorage`. |
| `src/styles/` | `tokens.css` (design tokens), `ui.css` (shared components), `app.css` (pages, by section), `login.css` (sign-up, sign-in and onboarding). |
| `public/assets` | Assets exported from Figma (logo, icons, avatar, studio logos). |
| `public/media` | Preview posters and backdrops from TMDB. |

## Phones

Phones (up to 767px) follow the mobile designs rather than shrinking the desktop layout: a Get the
app bar, a floating bottom nav (Home, Library, Search, Account) that shrinks while scrolling,
menus as bottom sheets, Notifications as a page, and a portrait video player (picture centred,
details and episodes underneath; for a series the picture pins to the top as the details scroll).
Library leads with what you can watch: a compact balance row, Continue Watching, then My access
(time left in plain words, expired passes kept to renew, the studio under each).
Phone-only rules live in `@media (max-width: 767px)` blocks next to the desktop rules they adjust.

## Prototype-only (replace for production)

- **Auth is mocked.** Google/Apple buttons and the Google account chooser are front-end stand-ins;
  the session is a `localStorage` flag and route guards run on the client
  (`src/components/Guards.tsx`). Real auth should use a cookie session with middleware so pages can
  render on the server.
- **Content is hard-coded** in `src/data/`; posters and backdrops come from TMDB for preview only.
  Episodes take an optional `season`; a series with more than one season gets a season picker
  on phones.
- **Video is YouTube embeds**, cropped and scaled to hide YouTube's chrome. YouTube still shows a
  start indicator, takes ~1-2s to begin, and can't do true full screen or picture-in-picture on
  iPhone (the player turns itself sideways instead). Production should stream Circo's own video
  (e.g. HLS), which removes all three.
- **Payments are simulated.** `src/data/payments.ts` documents the Paystack integration to put in
  its place; `?pay=declined` and `?pay=timeout` rehearse the failure paths.
- **Player hiccups are simulated** (load failures, blocked autoplay, slow connection) for testing;
  add `?hiccups=off` to a `/watch` URL to turn them off.
- **Casting is a demo.** On phones, Cast opens a QR scanner that "finds" a screen and connects
  (no camera: that needs https and the real pairing service). It fails to read the code or to
  connect about one time in four each; `?cast=noscan`, `?cast=fail` or `?cast=ok` force an outcome.
- **Devices** in Account lists sample devices besides the one you're on; logging one out lasts
  until reload. The real list comes from the session service.
- **Get the app** links to `#` until the App Store / Play Store listings exist (`APP_URL` in
  `src/components/Nav.tsx`).
- **Device linking** (the QR code) is decorative.
