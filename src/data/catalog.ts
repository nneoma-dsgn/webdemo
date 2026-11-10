import type { TheaterItem } from '../components/Theater'
import { exploreStudios } from './explore'

const a = (file: string) => `/assets/${file}`
/* Preview artwork from TMDB (posters w500, backdrops w1280). Placeholder for the real catalogue. */
const poster = (id: string) => `/media/${id}-poster.jpg`
const backdrop = (id: string) => `/media/${id}-backdrop.jpg`
/* 640px copy for small surfaces (hover preview), so it shows instantly. */
export const backdropSm = (id: string) => `/media/${id}-backdrop-sm.jpg`

export type Title = {
  id: string
  name: string
  kind: 'show' | 'series'
  poster: string // portrait artwork (156 x 218 in the mobile design)
  still: string // landscape artwork for wide cards and backdrops
  blurb: string
  genre: string
  origin: 'ng' | 'intl'
  studioId: string
  year: number
  rating: string
  /* Public studios sell a pass per title; private studios sell a subscription. */
  access: 'public' | 'private'
  passPrice: number // naira, public titles only
}

export type Studio = {
  id: string
  name: string
  logo: string
  backdrop: string
  about: string
  teaser?: string // the studio's own reel; studios without one show STUDIO_PLACEHOLDER
}

/* Shown on studio pages until the studio uploads its own teaser: a quiet film-set loop. */
export const STUDIO_PLACEHOLDER = '/media/studio-teaser.mp4'

export const studios: Record<string, Studio> = {
  harmattan: {
    id: 'harmattan',
    name: 'Harmattan House',
    logo: a('studios/harmattan.svg'),
    backdrop: backdrop('squid'),
    about: 'Lagos-born drama house making the stories families argue about at dinner: love, money, power and blood.',
  },
  redearth: {
    id: 'redearth',
    name: 'Red Earth Pictures',
    logo: a('studios/redearth.svg'),
    backdrop: backdrop('anikulapo'),
    about: 'Big, mythic Nigerian cinema shot on location, from Oyo kingdoms to the shoreline gods.',
  },
  lagoon: {
    id: 'lagoon',
    name: 'Rivers Edge Films',
    logo: a('studios/lagoon.svg'),
    backdrop: backdrop('gangs'),
    about: 'Fast, street-level stories from the city that never sleeps: crime, hustle and Lagos after dark.',
  },
  okra: {
    id: 'okra',
    name: 'Rooftop Comedy',
    logo: a('studios/okra.svg'),
    backdrop: backdrop('b99'),
    about: 'Comedy first. Sitcoms and ensemble series built around the people you know.',
  },
  ninemoons: {
    id: 'ninemoons',
    name: 'Nine Moons Studio',
    logo: a('studios/ninemoons.svg'),
    backdrop: backdrop('severance'),
    about: 'Prestige series from around the world, picked for the ones you can’t stop at one episode.',
  },
  silverline: {
    id: 'silverline',
    name: 'Silverline Pictures',
    logo: a('studios/silverline.svg'),
    backdrop: backdrop('dune'),
    about: 'The big screen at home: blockbusters, auteur films and event cinema.',
  },
  kolanut: {
    id: 'kolanut',
    name: 'Kola Nut Entertainment',
    logo: a('studios/kolanut.svg'),
    backdrop: backdrop('bridgerton'),
    about: 'Romance and family series, arriving on Circo soon.',
  },
  thirdmainland: {
    id: 'thirdmainland',
    name: 'Third Mainland Media',
    logo: a('studios/thirdmainland.svg'),
    backdrop: backdrop('funmilayo'),
    about: 'True stories, biopics and the people who shaped Nigeria. First titles premiering soon.',
  },
  lekki: {
    id: 'lekki',
    name: 'Lekki Light Studios',
    logo: a('studios/lekki.svg'),
    backdrop: backdrop('skinnygirl'),
    about: 'Feel-good series from the island: friendship, dating and city life.',
  },
  ojuelegba: {
    id: 'ojuelegba',
    name: 'Ojuelegba Originals',
    logo: a('studios/ojuelegba.svg'),
    backdrop: backdrop('gidiblues'),
    about: 'Street stories from the mainland, told by the people who live them.',
  },
  northstar: {
    id: 'northstar',
    name: 'Northern Star Media',
    logo: a('studios/northstar.svg'),
    backdrop: backdrop('silo'),
    about: 'Big-world science fiction and mystery series.',
  },
  savannah: {
    id: 'savannah',
    name: 'Savannah Reel',
    logo: a('studios/savannah.svg'),
    backdrop: backdrop('blackbook'),
    about: 'Lean, tense thrillers from across West Africa.',
  },
  ember: {
    id: 'ember',
    name: 'Ember and Ash Films',
    logo: a('studios/ember.svg'),
    backdrop: backdrop('citation'),
    about: 'Courtroom and campus dramas, premiering soon.',
  },
}

/* Explore's publishers (podcasts, masterclasses and the rest) are studios too. */
Object.assign(studios, exploreStudios)

type Seed = [id: string, name: string, kind: Title['kind'], year: number, rating: string, genre: string, origin: Title['origin'], studioId: string, blurb: string]

const seeds: Seed[] = [
  // Nollywood
  ['tribe', 'A Tribe Called Judah', 'show', 2023, '16+', 'Comedy', 'ng', 'harmattan', 'Five brothers from five fathers plan a heist to save their mother.'],
  ['kob', 'King of Boys', 'show', 2018, '18+', 'Crime', 'ng', 'harmattan', 'A businesswoman fights to keep her empire when politics turns on her.'],
  ['anikulapo', 'Aníkúlápó', 'show', 2022, '16+', 'Fantasy', 'ng', 'redearth', 'A traveller in the Oyo Empire is brought back to life by a mystical bird.'],
  ['jagun', 'Jagun Jagun', 'show', 2023, '16+', 'Epic', 'ng', 'thirdmainland', 'A young man joins an elite army under a fearsome warlord.'],
  ['gangs', 'Gangs of Lagos', 'show', 2023, '18+', 'Crime', 'ng', 'lagoon', 'Three friends from Isale Eko are pulled into a deadly fight for power.'],
  ['wedding', 'The Wedding Party', 'show', 2016, '13+', 'Romance', 'ng', 'harmattan', 'Two families, one wedding, and everything that can go wrong does.'],
  ['bloodsisters', 'Blood Sisters', 'series', 2022, '16+', 'Thriller', 'ng', 'harmattan', 'Two best friends go on the run after a wedding-eve tragedy.'],
  ['shanty', 'Shanty Town', 'series', 2023, '18+', 'Crime', 'ng', 'harmattan', 'A group of courtesans try to break free from a ruthless kingpin.'],
  ['lionheart', 'Lionheart', 'show', 2018, '13+', 'Drama', 'ng', 'harmattan', 'A daughter steps up to save her father’s transport company.'],
  ['citation', 'Citation', 'show', 2020, '16+', 'Drama', 'ng', 'ember', 'A student takes on a powerful professor after an assault.'],
  ['breath', 'Breath of Life', 'show', 2023, '13+', 'Drama', 'ng', 'harmattan', 'A reclusive former preacher finds new purpose through a gifted young man.'],
  ['funmilayo', 'Funmilayo Ransome-Kuti', 'show', 2024, '13+', 'Biopic', 'ng', 'thirdmainland', 'The activist who led Nigerian women in the fight for their rights.'],
  // International
  ['silo', 'Silo', 'series', 2023, '16+', 'Drama', 'intl', 'northstar', 'One last coffee. A lifetime of memories. Come home to your favourite six.'],
  ['dune', 'Dune: Part Two', 'show', 2024, '13+', 'Sci-fi', 'intl', 'silverline', 'Paul Atreides unites with the Fremen on a path of revenge.'],
  ['squid', 'Squid Game', 'series', 2021, '18+', 'Thriller', 'intl', 'ninemoons', 'Hundreds of desperate players compete in deadly children’s games.'],
  ['wednesday', 'Wednesday', 'series', 2022, '13+', 'Mystery', 'intl', 'kolanut', 'Wednesday Addams investigates a killing spree at Nevermore Academy.'],
  ['bear', 'The Bear', 'series', 2022, '16+', 'Drama', 'intl', 'ninemoons', 'A fine-dining chef comes home to run his family’s sandwich shop.'],
  ['severance', 'Severance', 'series', 2022, '16+', 'Sci-fi', 'intl', 'ninemoons', 'Office workers surgically split their work and personal memories.'],
  ['moneyheist', 'Money Heist', 'series', 2017, '16+', 'Crime', 'intl', 'ninemoons', 'Eight robbers take over the Royal Mint of Spain.'],
  ['lastofus', 'The Last of Us', 'series', 2023, '18+', 'Drama', 'intl', 'ninemoons', 'A smuggler escorts a teenage girl across a ruined America.'],
  ['bridgerton', 'Bridgerton', 'series', 2020, '16+', 'Romance', 'intl', 'kolanut', 'Love and scandal among the high society of Regency London.'],
  ['oppenheimer', 'Oppenheimer', 'show', 2023, '16+', 'Drama', 'intl', 'silverline', 'The physicist behind the atomic bomb and the cost of his work.'],
  // More Nollywood
  ['blackbook', 'The Black Book', 'show', 2023, '16+', 'Thriller', 'ng', 'savannah', 'A deacon takes on a corrupt gang to clear his murdered son’s name.'],
  ['mamiwata', 'Mami Wata', 'show', 2023, '16+', 'Fantasy', 'ng', 'redearth', 'A village’s faith in its water goddess is shaken when a stranger washes ashore.'],
  ['ijogbon', 'Ìjọ̀gbọ̀n', 'show', 2023, '13+', 'Adventure', 'ng', 'redearth', 'Four teenagers find a stash of diamonds and trouble follows them home.'],
  ['gidiblues', 'Gidi Blues', 'show', 2016, '13+', 'Romance', 'ng', 'ojuelegba', 'A Lagos playboy falls for a woman who wants nothing to do with his world.'],
  ['farfromhome', 'Far From Home', 'series', 2022, '16+', 'Drama', 'ng', 'lagoon', 'A struggling teen wins a scholarship to an elite school and starts living a lie.'],
  ['smartmoney', 'The Smart Money Woman', 'series', 2020, '16+', 'Comedy', 'ng', 'lagoon', 'Five friends in Lagos chase love, money and the lives they want.'],
  // More international
  ['barbie', 'Barbie', 'show', 2023, '13+', 'Comedy', 'intl', 'silverline', 'Barbie leaves Barbieland and discovers the real world isn’t what she expected.'],
  ['spiderverse', 'Spider-Man: Across the Spider-Verse', 'show', 2023, '13+', 'Animation', 'intl', 'silverline', 'Miles Morales is thrown across the multiverse and up against every Spider-Person.'],
  ['shogun', 'Shōgun', 'series', 2024, '18+', 'Drama', 'intl', 'ninemoons', 'A shipwrecked English sailor is caught in a war for power in feudal Japan.'],
  ['strangerthings', 'Stranger Things', 'series', 2016, '16+', 'Sci-fi', 'intl', 'northstar', 'A boy vanishes and a small town uncovers secret experiments and a girl with powers.'],
  // Sitcoms
  ['skinnygirl', 'Skinny Girl in Transit', 'series', 2015, '13+', 'Comedy', 'ng', 'lekki', 'A radio presenter juggles her weight, her mother and her love life in Lagos.'],
  ['theoffice', 'The Office', 'series', 2005, '13+', 'Comedy', 'intl', 'okra', 'A camera crew follows the very ordinary staff of a paper company and their boss.'],
  ['friends', 'Friends', 'series', 1994, '13+', 'Comedy', 'intl', 'okra', 'Six friends in New York get through work, love and everything in between.'],
  ['b99', 'Brooklyn Nine-Nine', 'series', 2013, '13+', 'Comedy', 'intl', 'okra', 'A gifted but goofy detective meets his match in a strict new captain.'],
  ['abbott', 'Abbott Elementary', 'series', 2021, '13+', 'Comedy', 'intl', 'lekki', 'Teachers at an underfunded Philadelphia school do their best for their kids.'],
  ['modernfamily', 'Modern Family', 'series', 2009, '13+', 'Comedy', 'intl', 'okra', 'Three branches of one big family, and all the mess that comes with them.'],
  ['parksrec', 'Parks and Recreation', 'series', 2009, '13+', 'Comedy', 'intl', 'okra', 'An endlessly upbeat official tries to turn a pit into a park in small-town Indiana.'],
  ['shameless', 'Shameless', 'series', 2011, '18+', 'Comedy', 'intl', 'okra', 'A brilliant, broke family of six raise themselves while their father drinks.'],
  ['freshprince', 'The Fresh Prince of Bel-Air', 'series', 1990, '13+', 'Comedy', 'intl', 'okra', 'A street-smart teen from Philadelphia moves in with his rich relatives in Bel-Air.'],
]

/* Access and price for titles that need specific ones; the rest are picked from the id. Premium
   passes cost more than the starting balance, so the top-up flow comes up. */
/* Private studios sell a subscription to everything they make; public ones sell passes. */
const STUDIO_ACCESS: Record<string, Title['access']> = {
  harmattan: 'private',
  redearth: 'public',
  lagoon: 'public',
  okra: 'public',
  ninemoons: 'private',
  silverline: 'public',
  kolanut: 'private',
  thirdmainland: 'public',
  lekki: 'private',
  ojuelegba: 'public',
  northstar: 'private',
  savannah: 'public',
  ember: 'public',
}

const PRICING: Record<string, { access: Title['access']; passPrice?: number }> = {
  blackbook: { access: 'public', passPrice: 22000 },
  barbie: { access: 'public', passPrice: 25000 },
  spiderverse: { access: 'public', passPrice: 35000 },
  shogun: { access: 'public', passPrice: 28000 },
  mamiwata: { access: 'public', passPrice: 4500 },
  ijogbon: { access: 'public', passPrice: 3500 },
  gidiblues: { access: 'public', passPrice: 2500 },
  farfromhome: { access: 'private' },
  smartmoney: { access: 'private' },
  strangerthings: { access: 'private' },
  skinnygirl: { access: 'public', passPrice: 2000 },
  theoffice: { access: 'private' },
  friends: { access: 'public', passPrice: 24000 },
  b99: { access: 'public', passPrice: 3000 },
  abbott: { access: 'public', passPrice: 3500 },
  modernfamily: { access: 'private' },
  parksrec: { access: 'public', passPrice: 2500 },
  freshprince: { access: 'public', passPrice: 3000 },
  shameless: { access: 'public', passPrice: 3500 },
}

/* Stable pseudo-random pick per id, so server and client agree. */
const hash = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const PASS_PRICES = [1500, 2000, 2500, 3000]

export const titles: Record<string, Title> = Object.fromEntries(
  seeds.map(([id, name, kind, year, rating, genre, origin, studioId, blurb]) => [
    id,
    {
      id,
      name,
      kind,
      year,
      rating,
      genre,
      origin,
      studioId,
      blurb,
      poster: poster(id),
      still: backdrop(id),
      access: PRICING[id]?.access ?? STUDIO_ACCESS[studioId] ?? (hash(id) % 2 ? 'public' : 'private'),
      passPrice: PRICING[id]?.passPrice ?? PASS_PRICES[(hash(id) >>> 3) % PASS_PRICES.length],
    },
  ]),
)
// The home hero keeps the exact Silo artwork from the Figma file.
titles.silo.still = a('hero-silo.png')

/* Subscription plans for private studios. */
export const plans = [
  { id: 'week', label: 'Weekly Access', price: 5000, per: 'week' },
  { id: 'month', label: 'Monthly Access', price: 18000, per: 'month' },
  { id: 'year', label: 'Annual Access', price: 55000, per: 'year' },
]

export const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`

export type Shelf = {
  id: string
  title: string
  items: string[]
}

/* Shelves on the home feed, in the order of the mobile design. */
export const mustSee: Shelf = { id: 'must-see', title: 'Must See', items: ['tribe', 'squid', 'kob', 'severance', 'anikulapo', 'lastofus', 'gangs', 'bear'] }
export const nollywood: Shelf = { id: 'nollywood', title: 'Nollywood Hits', items: seeds.filter((s) => s[6] === 'ng').map((s) => s[0]) }
export const all: Shelf = { id: 'all', title: 'All', items: seeds.map((s) => s[0]) }

export const comingSoon: { id: string; when: string; label?: string[] }[] = [
  { id: 'funmilayo', when: 'Coming 27 November' },
  { id: 'jagun', when: 'Coming 6 November' },
  { id: 'wednesday', when: 'More episodes soon' },
  { id: 'breath', when: 'Coming 14 November' },
  { id: 'bridgerton', when: 'Coming 2 December' },
  { id: 'citation', when: 'Coming 9 December' },
]

export const searchResults = [
  { id: 'r1', title: 'Red Light, Green Light', show: 'Squid Game', studio: 'The Velvet Studio', thumb: backdrop('squid') },
  { id: 'r2', title: 'Freedom Day', show: 'Silo', studio: 'The Velvet Studio', thumb: backdrop('silo') },
  { id: 'r3', title: 'King of Boys', show: 'Film', studio: 'The Velvet Studio', thumb: backdrop('kob') },
]

// Search before typing: everything that's out, newest titles mixed in.
export const browseGrid = seeds.map((x) => x[0]).filter((id) => !['funmilayo', 'jagun', 'breath', 'citation', 'wednesday', 'bridgerton'].includes(id))

export const shelves: Record<string, Shelf> = {
  'must-see': mustSee,
  'coming-to-circo': { id: 'coming-to-circo', title: 'Coming to Circo', items: comingSoon.map((c) => c.id) },
  nollywood,
  all,
}

export const icons = {
  play: a('icon-play.svg'),
  plus: a('icon-plus.svg'),
  bellPlus: a('icon-bell-plus.svg'),
  cast: a('icon-cast.svg'),
  chevronRight: a('icon-chevron-right.svg'),
  chevronLeft: a('icon-chevron-left.svg'),
  house: a('icon-house.svg'),
  library: a('icon-add-circle.svg'),
  search: a('icon-search.svg'),
  searchSm: a('icon-search-sm.svg'),
  more: a('icon-more.svg'),
  avatar: a('avatar.png'),
}

/* Theater on the signed-out page: preview trailers on YouTube, each played as a short clip
   from the middle of the trailer. Tints are each backdrop's dominant colour. */
export const featured: TheaterItem[] = [
  { id: 'kob', title: 'King of Boys', still: backdrop('kob'), poster: poster('kob'), tint: '#9b8f6d', videoId: 'cF-FQLKaUCk', start: 12, end: 34 },
  { id: 'anikulapo', title: 'Aníkúlápó', still: backdrop('anikulapo'), poster: poster('anikulapo'), tint: '#8c3305', videoId: 'rXIKrHPaB-o', start: 25, end: 47 },
  { id: 'gangs', title: 'Gangs of Lagos', still: backdrop('gangs'), poster: poster('gangs'), tint: '#a8823a', videoId: 'CBLhv0cgVSo', start: 25, end: 47 },
  { id: 'squid', title: 'Squid Game', still: backdrop('squid'), poster: poster('squid'), tint: '#a55e2b', videoId: 'Ed1sGgHUo88', start: 30, end: 52 },
  { id: 'shanty', title: 'Shanty Town', still: backdrop('shanty'), poster: poster('shanty'), tint: '#8c4b3c', videoId: 'g3-TbsMEVPw', start: 25, end: 47 },
  { id: 'bloodsisters', title: 'Blood Sisters', still: backdrop('bloodsisters'), poster: poster('bloodsisters'), tint: '#7a3d8c', videoId: 'QktxRxqrkPw', start: 25, end: 47 },
  { id: 'dune', title: 'Dune: Part Two', still: backdrop('dune'), poster: poster('dune'), tint: '#a8957b', videoId: 'U2Qp5pL3ovA', start: 40, end: 62 },
]

/* Home feeds: the Shows and Series tabs each get their own hero and shelves. */
export type Feed = {
  /* Hero carousel: featured titles with a clip each (rotates on the signed-in home). */
  heroes: { id: string; videoId: string; start: number; end: number }[]
  mustSee: string[]
  /* accessHours: time left on the access the user bought (24 hrs, 1 day, 7 days, 1 month or 1 year). */
  continueWatching: { id: string; accessHours: number; progress: number; ep?: string }[]
  middle: Shelf
  coming: { id: string; when: string; label?: string[] }[]
  all: string[]
}

const ofKind = (k: Title['kind']) => seeds.filter((s) => s[2] === k).map((s) => s[0])

export const feeds: Record<'shows' | 'series', Feed> = {
  shows: {
    // King of Boys trailer: 6s to 52s skips the studio logo and the cast cards.
    heroes: [
      { id: 'kob', videoId: 'cF-FQLKaUCk', start: 6, end: 40 },
      { id: 'tribe', videoId: 'pEUZVfeCU94', start: 15, end: 50 },
      { id: 'anikulapo', videoId: 'rXIKrHPaB-o', start: 25, end: 60 },
      { id: 'dune', videoId: 'U2Qp5pL3ovA', start: 40, end: 75 },
    ],
    mustSee: ['blackbook', 'tribe', 'barbie', 'anikulapo', 'spiderverse', 'dune', 'mamiwata', 'gangs', 'oppenheimer', 'ijogbon', 'lionheart', 'wedding'],
    continueWatching: [
      { id: 'tribe', accessHours: 17, progress: 0.55 },
      { id: 'dune', accessHours: 5, progress: 0.3 },
      { id: 'citation', accessHours: 576, progress: 0.82 },
      { id: 'gangs', accessHours: 120, progress: 0.12 },
    ],
    middle: { id: 'nollywood', title: 'Nollywood Hits', items: ofKind('show').filter((id) => titles[id].origin === 'ng') },
    coming: [
      { id: 'funmilayo', when: 'Coming 27 November' },
      { id: 'jagun', when: 'Coming 6 November' },
      { id: 'breath', when: 'Coming 14 November' },
      { id: 'citation', when: 'Coming 9 December' },
    ],
    all: ofKind('show'),
  },
  series: {
    // Silo Season 3 trailer: 6s to 147s skips the Apple TV intro and end cards.
    heroes: [
      { id: 'silo', videoId: 'BLBvbMtjyAQ', start: 20, end: 55 },
      { id: 'squid', videoId: 'Ed1sGgHUo88', start: 30, end: 65 },
      { id: 'severance', videoId: '_UXKlYvLGJY', start: 25, end: 60 },
      { id: 'lastofus', videoId: 'wk5vOCcASHg', start: 20, end: 55 },
    ],
    mustSee: ['shogun', 'squid', 'shameless', 'farfromhome', 'abbott', 'severance', 'strangerthings', 'skinnygirl', 'lastofus', 'smartmoney', 'shanty', 'bear', 'theoffice', 'bloodsisters', 'moneyheist', 'wednesday'],
    continueWatching: [
      { id: 'silo', accessHours: 72, progress: 0.6, ep: 'S1 · E4' },
      { id: 'bloodsisters', accessHours: 11, progress: 0.3, ep: 'EP 2' },
      { id: 'bear', accessHours: 7200, progress: 0.8, ep: 'S2 · E7' },
      { id: 'shanty', accessHours: 144, progress: 0.15, ep: 'EP 5' },
      { id: 'moneyheist', accessHours: 21, progress: 0.45, ep: 'S3 · E1' },
    ],
    middle: { id: 'binge', title: 'Binge-worthy', items: ['strangerthings', 'shameless', 'friends', 'moneyheist', 'shogun', 'b99', 'bridgerton', 'farfromhome', 'modernfamily', 'lastofus', 'parksrec', 'shanty', 'severance', 'freshprince', 'bloodsisters', 'squid'] },
    coming: [
      { id: 'wednesday', when: 'More episodes soon' },
      { id: 'bridgerton', when: 'Coming 2 December' },
      { id: 'severance', when: 'Season 3 in 2027' },
      { id: 'bear', when: 'New season soon' },
    ],
    all: ofKind('series'),
  },
}

/* Preview trailers on YouTube used for hover previews, as short clips past the studio cards.
   Titles without one fall back to their backdrop. */
/* Episodes for series that have them. Clips are YouTube stand-ins for the prototype; each one
   plays as that episode. Descriptions are Circo's own. */
export type Episode = { title: string; blurb: string; mins: number; videoId: string }

export const episodes: Record<string, Episode[]> = {
  squid: [
    { title: 'Red Light, Green Light', mins: 60, videoId: 'PHWML7JdVTE', blurb: 'Broke and out of options, Gi-hun accepts a stranger’s invitation to play a game. The first round turns deadly.' },
    { title: 'Hell', mins: 63, videoId: 'oqxAJKy0ii4', blurb: 'The survivors vote to walk away, but life outside is its own kind of trap, and the invitation comes again.' },
    { title: 'The Man with the Umbrella', mins: 55, videoId: '51smxeWPaW4', blurb: 'Back in the arena, a childhood sweet becomes a test of nerve, and Gi-hun draws the hardest shape.' },
    { title: 'Stick to the Team', mins: 55, videoId: 'njQUQ6SUmjk', blurb: 'Lights go out in the dormitory and the night turns violent. By morning, everyone needs a team.' },
    { title: 'A Fair World', mins: 52, videoId: 'VEtmLWXTTA4', blurb: 'A secret trade among the guards comes to light, while a detective hides in plain sight.' },
    { title: 'Gganbu', mins: 62, videoId: 'Gj8pBmiiYeM', blurb: 'Partners are told to play against each other. Friendships are tested over a bag of marbles.' },
    { title: 'VIPS', mins: 58, videoId: 'lwZJHHQ8ib4', blurb: 'Masked guests arrive to watch as the remaining players face a bridge made of glass.' },
    { title: 'Front Man', mins: 33, videoId: 'Ls8ilKMQHxQ', blurb: 'Three players remain. Grief and suspicion build on the eve of the final game.' },
    { title: 'One Lucky Day', mins: 56, videoId: 'fGUJ7MRWa68', blurb: 'The last two face off in the game that started it all. One walks away with the prize, and a question.' },
  ],
}

/* Audio and subtitle languages. The original language comes first; dubs and subtitles vary by
   title (picked from the id, so each title keeps the same set). */
const ORIGINAL: Record<string, string> = { anikulapo: 'Yoruba', jagun: 'Yoruba', ijogbon: 'Yoruba', funmilayo: 'Yoruba', squid: 'Korean', moneyheist: 'Spanish', shogun: 'Japanese' }
const NG_DUBS = ['English', 'Pidgin', 'Hausa', 'Igbo', 'Yoruba']
const INTL_DUBS = ['English', 'French', 'Pidgin']
const SUB_LANGS = ['English', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin', 'French']
const pick = (id: string, list: string[], n: number) => {
  const h = [...id].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5)
  return list.filter((_, i) => (h >> i) & 1).slice(0, n)
}
export function languagesFor(t: Title) {
  const original = ORIGINAL[t.id] ?? 'English'
  const dubs = pick(t.id, t.origin === 'ng' ? NG_DUBS : INTL_DUBS, 3).filter((l) => l !== original)
  if (original !== 'English' && !dubs.includes('English')) dubs.unshift('English')
  const subs = ['English', ...pick(t.id + 's', SUB_LANGS.slice(1), 3)]
  return { audio: [original, ...dubs], original, subtitles: subs }
}

/* Real-world hiccups, rolled fresh on every visit so the player's error states turn up
   naturally (the ?fail=, ?pay=, ?autoplay=off and ?slow=1 flags still force one). */
export const HICCUPS = { loadFail: 0.1, autoplayBlocked: 0.1, slow: 0.15, payFail: 0.2 }
export const roll = (chance: number) => Math.random() < chance

/* Test titles that misbehave on every visit, for quick checks. A load failure only hits the
   first try, so Retry moves on to the next issue; a payment failure only hits the first charge. */
export type Hiccups = { load?: 'load' | 'timeout'; autoplay?: boolean; slow?: boolean; pay?: 'declined' | 'timeout' }
export const ALWAYS: Record<string, Hiccups> = {
  gidiblues: { load: 'load', autoplay: true, slow: true, pay: 'declined' },
  parksrec: { load: 'timeout', autoplay: true, slow: true, pay: 'timeout' },
  mamiwata: { load: 'timeout' },
  theoffice: { autoplay: true },
  smartmoney: { slow: true },
  barbie: { pay: 'declined' },
  friends: { pay: 'timeout' },
}

/* What plays once a title is unlocked: another real video of the same title (a scene or clip,
   never its trailer), so it's clearly not the teaser. Titles without one fall back to a sample. */
export const films: Record<string, string> = {
  shameless: 'sbCEGo-B9C4',
  kob: 'vo0K0fl__Zc',
  jagun: 'gHU_u8wQkOc',
  shanty: 'dIDZNFD199s',
  breath: 'DifiD3gD7Vw',
  silo: '2HWLe6TMzvI',
  dune: 'BEO2D_hhXDs',
  severance: '2RAE3bC1RZY',
  lastofus: 'j8psSy34-c0',
  oppenheimer: 'tK0IDmSYYGk',
  gidiblues: '85rvGcGZamY',
  barbie: 'CBqlDWHkdHk',
  spiderverse: '-rnS2GG0zpg',
  shogun: 'ClmWZX28ARg',
  strangerthings: 'w323iXW02G4',
  skinnygirl: 'cMJVwMa_aSE',
  theoffice: '6clWCvx63Ao',
  friends: 'Lhpu3GdlV3w',
  b99: 'HlBYdiXdUa8',
  abbott: 'RJgndIsVg-M',
  modernfamily: 'yaSBXuwEZJE',
  parksrec: 'IDJ2ic5u770',
  freshprince: 'Snj9NS3tfVM',
}

/* Sample films for titles without a clip of their own: Blender Studio's open movies, one per
   title (and episode). The player labels these "Sample film". */
const FEATURES = ['eRsGyueVLvQ', 'R6MlUcmOul8', 'aqz-KE-bpKQ', 'Y-rmzh0PI3c', 'WhWc3b3KhnY', 'mN0zPOpADL4', 'TLkA0RELQ1g', 'UXqq0ZvbOnk', 'PVGeM40dABA']
export const featureFor = (id: string, ep = 1) => FEATURES[([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) + ep - 1) % FEATURES.length]

/* Episode artwork from the clip itself, until Circo has its own stills. */
export const episodeThumb = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

export const trailers: Record<string, { videoId: string; start: number; end: number }> = {
  tribe: { videoId: 'pEUZVfeCU94', start: 15, end: 60 },
  kob: { videoId: 'cF-FQLKaUCk', start: 6, end: 52 },
  anikulapo: { videoId: 'rXIKrHPaB-o', start: 25, end: 70 },
  gangs: { videoId: 'CBLhv0cgVSo', start: 25, end: 70 },
  squid: { videoId: 'Ed1sGgHUo88', start: 30, end: 75 },
  shanty: { videoId: 'g3-TbsMEVPw', start: 25, end: 70 },
  bloodsisters: { videoId: 'QktxRxqrkPw', start: 25, end: 70 },
  dune: { videoId: 'U2Qp5pL3ovA', start: 40, end: 85 },
  silo: { videoId: 'BLBvbMtjyAQ', start: 20, end: 65 },
  oppenheimer: { videoId: 'keydELfWuMQ', start: 20, end: 65 },
  jagun: { videoId: 'InNrl2-tl58', start: 20, end: 65 },
  lionheart: { videoId: 'XLHR9wNzNB0', start: 20, end: 65 },
  wedding: { videoId: 'taXftAd2kGA', start: 20, end: 65 },
  severance: { videoId: '_UXKlYvLGJY', start: 25, end: 70 },
  lastofus: { videoId: 'wk5vOCcASHg', start: 20, end: 65 },
  // Coming soon: these end on a reminder instead of access options.
  funmilayo: { videoId: 'VUlOxcbI4CY', start: 15, end: 60 },
  wednesday: { videoId: 'Di310WS8zLk', start: 10, end: 55 },
  breath: { videoId: 'yXJA6f3p71A', start: 15, end: 60 },
  bridgerton: { videoId: 'gpv7ayf_tyE', start: 20, end: 65 },
  citation: { videoId: 'I_64eebjIDQ', start: 15, end: 60 },
  blackbook: { videoId: '6PPH4SOm9gk', start: 15, end: 60 },
  mamiwata: { videoId: 'FPWBaKBYUfw', start: 15, end: 60 },
  ijogbon: { videoId: 'ocOjEtqq_Nw', start: 15, end: 60 },
  gidiblues: { videoId: 'Rk7wLD3vt-Q', start: 15, end: 60 },
  farfromhome: { videoId: 'JtrA9DELEhA', start: 15, end: 60 },
  smartmoney: { videoId: 'oPAxVbqh8cI', start: 15, end: 60 },
  barbie: { videoId: 'pBk4NYhWNMM', start: 20, end: 65 },
  spiderverse: { videoId: 'cqGjhVJWtEg', start: 20, end: 65 },
  shogun: { videoId: 'yAN5uspO_hk', start: 20, end: 65 },
  strangerthings: { videoId: 'b9EkMc79ZSU', start: 20, end: 65 },
  skinnygirl: { videoId: 'N7vBDpLAdgU', start: 10, end: 55 },
  theoffice: { videoId: '-DveSNTYbXU', start: 10, end: 55 },
  friends: { videoId: 'Zg2LCD5QOJs', start: 10, end: 55 },
  b99: { videoId: 'sEOuJ4z5aTc', start: 10, end: 55 },
  abbott: { videoId: 'l4lP8roLz3I', start: 5, end: 30 },
  modernfamily: { videoId: 'Ub_lfN2VMIo', start: 10, end: 55 },
  parksrec: { videoId: '5IZWeAwdJ-s', start: 10, end: 55 },
  freshprince: { videoId: '_u6vYpbfCmQ', start: 10, end: 55 },
  shameless: { videoId: '9tvkYS5cA58', start: 10, end: 55 },
  moneyheist: { videoId: '_InqQJRqGW4', start: 10, end: 55 },
  bear: { videoId: 'ojjCvICC86c', start: 10, end: 55 },
}

/* Is this title coming soon? One answer for the whole app: the main list plus every feed's
   "Coming to Circo" row (new seasons included). Coming soon is always trailer only. */
export function upcoming(id: string) {
  return [...comingSoon, ...feeds.shows.coming, ...feeds.series.coming].find((c) => c.id === id)
}

