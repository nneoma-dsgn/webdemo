import type { TheaterItem } from '../components/Theater'

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
}

export const studios: Record<string, Studio> = {
  wb: {
    id: 'wb',
    name: 'Warner Bros',
    logo: a('studio-wb.png'),
    backdrop: backdrop('dune'),
    about: 'Film and television from one of the oldest studios in the business.',
  },
  velvet: {
    id: 'velvet',
    name: 'The Velvet Studio',
    logo: a('studio-wb.png'),
    backdrop: a('backdrop-velvet.jpg'),
    about:
      'Independent film production company based in Boston. Founded in 1993, we craft compelling visual stories that span thrilling dramas, indie comedies, and bold documentaries.',
  },
}

type Seed = [id: string, name: string, kind: Title['kind'], year: number, rating: string, genre: string, origin: Title['origin'], studioId: string, blurb: string]

const seeds: Seed[] = [
  // Nollywood
  ['tribe', 'A Tribe Called Judah', 'show', 2023, '16+', 'Comedy', 'ng', 'velvet', 'Five brothers from five fathers plan a heist to save their mother.'],
  ['kob', 'King of Boys', 'show', 2018, '18+', 'Crime', 'ng', 'velvet', 'A businesswoman fights to keep her empire when politics turns on her.'],
  ['anikulapo', 'Aníkúlápó', 'show', 2022, '16+', 'Fantasy', 'ng', 'velvet', 'A traveller in the Oyo Empire is brought back to life by a mystical bird.'],
  ['jagun', 'Jagun Jagun', 'show', 2023, '16+', 'Epic', 'ng', 'velvet', 'A young man joins an elite army under a fearsome warlord.'],
  ['gangs', 'Gangs of Lagos', 'show', 2023, '18+', 'Crime', 'ng', 'velvet', 'Three friends from Isale Eko are pulled into a deadly fight for power.'],
  ['wedding', 'The Wedding Party', 'show', 2016, '13+', 'Romance', 'ng', 'velvet', 'Two families, one wedding, and everything that can go wrong does.'],
  ['bloodsisters', 'Blood Sisters', 'series', 2022, '16+', 'Thriller', 'ng', 'velvet', 'Two best friends go on the run after a wedding-eve tragedy.'],
  ['shanty', 'Shanty Town', 'series', 2023, '18+', 'Crime', 'ng', 'velvet', 'A group of courtesans try to break free from a ruthless kingpin.'],
  ['lionheart', 'Lionheart', 'show', 2018, '13+', 'Drama', 'ng', 'velvet', 'A daughter steps up to save her father’s transport company.'],
  ['citation', 'Citation', 'show', 2020, '16+', 'Drama', 'ng', 'velvet', 'A student takes on a powerful professor after an assault.'],
  ['breath', 'Breath of Life', 'show', 2023, '13+', 'Drama', 'ng', 'velvet', 'A reclusive former preacher finds new purpose through a gifted young man.'],
  ['funmilayo', 'Funmilayo Ransome-Kuti', 'show', 2024, '13+', 'Biopic', 'ng', 'velvet', 'The activist who led Nigerian women in the fight for their rights.'],
  // International
  ['silo', 'Silo', 'series', 2023, '16+', 'Drama', 'intl', 'velvet', 'One last coffee. A lifetime of memories. Come home to your favourite six.'],
  ['dune', 'Dune: Part Two', 'show', 2024, '13+', 'Sci-fi', 'intl', 'wb', 'Paul Atreides unites with the Fremen on a path of revenge.'],
  ['squid', 'Squid Game', 'series', 2021, '18+', 'Thriller', 'intl', 'velvet', 'Hundreds of desperate players compete in deadly children’s games.'],
  ['wednesday', 'Wednesday', 'series', 2022, '13+', 'Mystery', 'intl', 'velvet', 'Wednesday Addams investigates a killing spree at Nevermore Academy.'],
  ['bear', 'The Bear', 'series', 2022, '16+', 'Drama', 'intl', 'velvet', 'A fine-dining chef comes home to run his family’s sandwich shop.'],
  ['severance', 'Severance', 'series', 2022, '16+', 'Sci-fi', 'intl', 'velvet', 'Office workers surgically split their work and personal memories.'],
  ['moneyheist', 'Money Heist', 'series', 2017, '16+', 'Crime', 'intl', 'velvet', 'Eight robbers take over the Royal Mint of Spain.'],
  ['lastofus', 'The Last of Us', 'series', 2023, '18+', 'Drama', 'intl', 'wb', 'A smuggler escorts a teenage girl across a ruined America.'],
  ['bridgerton', 'Bridgerton', 'series', 2020, '16+', 'Romance', 'intl', 'velvet', 'Love and scandal among the high society of Regency London.'],
  ['oppenheimer', 'Oppenheimer', 'show', 2023, '16+', 'Drama', 'intl', 'velvet', 'The physicist behind the atomic bomb and the cost of his work.'],
]

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
      access: hash(id) % 2 ? 'public' : 'private',
      passPrice: PASS_PRICES[(hash(id) >>> 3) % PASS_PRICES.length],
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

export const browseGrid = ['tribe', 'squid', 'kob', 'silo', 'anikulapo', 'wednesday', 'gangs', 'severance', 'shanty', 'bear', 'wedding', 'lastofus', 'lionheart', 'moneyheist', 'bloodsisters', 'oppenheimer', 'citation', 'bridgerton']

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
    mustSee: ['tribe', 'anikulapo', 'dune', 'gangs', 'oppenheimer', 'jagun', 'lionheart', 'wedding'],
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
    mustSee: ['squid', 'severance', 'lastofus', 'shanty', 'bear', 'bloodsisters', 'moneyheist', 'wednesday'],
    continueWatching: [
      { id: 'silo', accessHours: 72, progress: 0.6, ep: 'S1 · E4' },
      { id: 'bloodsisters', accessHours: 11, progress: 0.3, ep: 'EP 2' },
      { id: 'bear', accessHours: 7200, progress: 0.8, ep: 'S2 · E7' },
      { id: 'shanty', accessHours: 144, progress: 0.15, ep: 'EP 5' },
      { id: 'moneyheist', accessHours: 21, progress: 0.45, ep: 'S3 · E1' },
    ],
    middle: { id: 'binge', title: 'Binge-worthy', items: ['moneyheist', 'bridgerton', 'lastofus', 'shanty', 'severance', 'bloodsisters', 'squid'] },
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

/* What plays once a title is unlocked, so it never looks like the teaser. Blender Studio's open
   movies stand in for the real films in the prototype; each title (and episode) gets one. */
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
}
