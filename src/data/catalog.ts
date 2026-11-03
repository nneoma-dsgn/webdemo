import type { TheaterItem } from '../components/Theater'

const a = (file: string) => `/assets/${file}`
/* Preview artwork from TMDB (posters w500, backdrops w1280). Placeholder for the real catalogue. */
const poster = (id: string) => `/media/${id}-poster.jpg`
const backdrop = (id: string) => `/media/${id}-backdrop.jpg`

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

export const titles: Record<string, Title> = Object.fromEntries(
  seeds.map(([id, name, kind, year, rating, genre, origin, studioId, blurb]) => [
    id,
    { id, name, kind, year, rating, genre, origin, studioId, blurb, poster: poster(id), still: backdrop(id) },
  ]),
)
// The home hero keeps the exact Silo artwork from the Figma file.
titles.silo.still = a('hero-silo.png')

export type Shelf = {
  id: string
  title: string
  items: string[]
}

/* Shelves on the home feed, in the order of the mobile design. */
export const mustSee: Shelf = { id: 'must-see', title: 'Must See', items: ['tribe', 'squid', 'kob', 'severance', 'anikulapo', 'lastofus', 'gangs', 'bear'] }
export const nollywood: Shelf = { id: 'nollywood', title: 'Nollywood Hits', items: seeds.filter((s) => s[6] === 'ng').map((s) => s[0]) }
export const all: Shelf = { id: 'all', title: 'All', items: seeds.map((s) => s[0]) }

export const continueWatching = [
  { id: 'silo', tag: '3 days', left: '52m left', progress: 0.6 },
  { id: 'bloodsisters', tag: '24 hrs', left: '38m left', progress: 0.3 },
  { id: 'bear', tag: 'Lifetime', left: '6m left', progress: 0.8 },
  { id: 'shanty', tag: '3 days', left: '1h 10m left', progress: 0.15 },
  { id: 'moneyheist', tag: '24 hrs', left: '44m left', progress: 0.45 },
]

export const comingSoon: { id: string; when: string; label?: string[] }[] = [
  { id: 'funmilayo', when: 'Coming 30 October' },
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
  hero: { id: string; videoId: string; start: number; end: number }
  mustSee: string[]
  continueWatching: { id: string; tag: string; left: string; progress: number }[]
  middle: Shelf
  coming: { id: string; when: string; label?: string[] }[]
  all: string[]
}

const ofKind = (k: Title['kind']) => seeds.filter((s) => s[2] === k).map((s) => s[0])

export const feeds: Record<'shows' | 'series', Feed> = {
  shows: {
    // King of Boys trailer: 6s to 52s skips the studio logo and the cast cards.
    hero: { id: 'kob', videoId: 'cF-FQLKaUCk', start: 6, end: 52 },
    mustSee: ['tribe', 'anikulapo', 'dune', 'gangs', 'oppenheimer', 'jagun', 'lionheart', 'wedding'],
    continueWatching: [
      { id: 'tribe', tag: '3 days', left: '48m left', progress: 0.55 },
      { id: 'dune', tag: '24 hrs', left: '1h 12m left', progress: 0.3 },
      { id: 'citation', tag: 'Lifetime', left: '20m left', progress: 0.82 },
      { id: 'gangs', tag: '3 days', left: '1h 30m left', progress: 0.12 },
    ],
    middle: { id: 'nollywood', title: 'Nollywood Hits', items: ofKind('show').filter((id) => titles[id].origin === 'ng') },
    coming: [
      { id: 'funmilayo', when: 'Coming 30 October' },
      { id: 'jagun', when: 'Coming 6 November' },
      { id: 'breath', when: 'Coming 14 November' },
      { id: 'citation', when: 'Coming 9 December' },
    ],
    all: ofKind('show'),
  },
  series: {
    // Silo Season 3 trailer: 6s to 147s skips the Apple TV intro and end cards.
    hero: { id: 'silo', videoId: 'BLBvbMtjyAQ', start: 6, end: 147 },
    mustSee: ['squid', 'severance', 'lastofus', 'shanty', 'bear', 'bloodsisters', 'moneyheist', 'wednesday'],
    continueWatching: [
      { id: 'silo', tag: '3 days', left: '52m left', progress: 0.6 },
      { id: 'bloodsisters', tag: '24 hrs', left: '38m left', progress: 0.3 },
      { id: 'bear', tag: 'Lifetime', left: '6m left', progress: 0.8 },
      { id: 'shanty', tag: '3 days', left: '1h 10m left', progress: 0.15 },
      { id: 'moneyheist', tag: '24 hrs', left: '44m left', progress: 0.45 },
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
}
