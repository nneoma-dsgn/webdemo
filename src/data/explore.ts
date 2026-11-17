import type { Episode as CatalogEpisode, Studio, Title } from './catalog'

/* Explore: everything under More (reality shows, micro dramas, documentaries, masterclasses,
   podcasts, music, education and religion),
   played from their publishers' YouTube channels. Full-length uploads only (no clips or
   trailers), each checked as embeddable. Swap for Circo's own catalogue once the backend serves it. */

export type Clip = { id: string; title: string; channel: string }
/* A show (podcast, series or channel) and its episodes, newest first. */
export type Show = { name: string; items: Clip[] }
/* Spotlight: the hero carousel, like Home's. Each slide plays a stretch of its video. */
export type Spot = { id: string; blurb: string; start: number; end: number }
export type Category = { id: string; label: string; spotlight: Spot[]; shows: Show[] }

/* YouTube artwork: full HD where the channel uploaded it, else the 16:9 medium size. */
export const clipThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
export const clipThumbFallback = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`

const show = (name: string, channel: string, list: [id: string, title: string][]): Show => ({
  name,
  items: list.map(([id, title]) => ({ id, title, channel })),
})
const spot = (id: string, blurb: string): Spot => ({ id, blurb, start: 30, end: 75 })

/* The categories under More, in Circo's order (data/categories.ts). Movie is the Shows tab. */
export const categories: Category[] = [
  {
    id: 'reality-shows',
    label: 'Reality Show',
    spotlight: [
      spot('aWTscD0FWXQ', 'GRIT: strangers take on the toughest challenges of their lives, on camera.'),
      spot('-5MBx6Oef1o', 'Steve Harvey hosts families from across the continent on Family Feud Africa.'),
      spot('U7HPADX2roU', 'Delicious or Disaster: home cooks against the clock, judged on every plate.'),
    ],
    shows: [
      show('GRIT', 'Faaji Productions', [['aWTscD0FWXQ', 'Episode 1: He Bodyshamed Me']]),
      show('Family Feud Africa', 'Family Feud Africa', [
        ['-5MBx6Oef1o', 'Family Feud Botswana'],
        ['VzyIrzdJPXM', '8 Hours of Family Feud Africa'],
        ['u6Sa7APnUGU', 'The Ultimate Marathon: All 78 Episodes'],
      ]),
      show('Who Wants to Be a Millionaire? Nigeria', 'Topnews TV Nigeria', [
        ['MDfqysbdfNg', 'Series 2, Episode 1'],
        ['dQRFcY8hFmo', 'Series 2, Episode 2'],
        ['pNNC2VqB8rY', 'Aroma Ufodike, the First Millionaire Winner'],
      ]),
      show('Delicious or Disaster', 'Diary of a Kitchen Lover', [['U7HPADX2roU', 'Episode 1']]),
    ],
  },
  {
    id: 'micro-dramas',
    label: 'Micro Drama',
    spotlight: [
      spot('AQLkM4h5Ee4', 'Insta-Married: a marriage of convenience that turns into the real thing.'),
      spot('0jIKRj7WgmQ', 'She turned down the bricklayer. Her friend didn’t, and he wasn’t what he seemed.'),
      spot('Nbiq8fJXqAg', 'A billionaire mother rides the bus in disguise, and the bride slaps the wrong woman.'),
    ],
    shows: [
      show('Insta-Married', 'ReelShort', [['AQLkM4h5Ee4', 'Insta-Married, All Episodes']]),
      show('The Poor Bricklayer', 'NanaDelia Studios', [['0jIKRj7WgmQ', 'The Poor Bricklayer, Full Story']]),
      show('Billionaire on the Bus', 'NYS Movie', [['Nbiq8fJXqAg', 'Billionaire on the Bus, Full Story']]),
      show('The Paralyzed CEO', 'ReelShort', [['1QKOOGgRLEc', 'The Paralyzed CEO, All Episodes']]),
      show('Some Marriages Begin as Lies', 'ReelShort', [['9aGZyHr9rbU', 'Some Marriages Begin as Lies, All Episodes']]),
      show('The Cold-Hearted Heir', 'Eve DramaTV', [['5QNI2kQ0Deo', 'The Cold-Hearted Heir, All Episodes']]),
    ],
  },
  {
    id: 'documentaries',
    label: 'Documentary',
    spotlight: [
      spot('K64_vALHLzo', 'BBC Africa Eye investigates how faith, fear and fake news spread across Nigeria.'),
      spot('c4--3q6iAa8', 'A Ugandan asylum seeker in Japan turns to filmmaking to tell his story.'),
      spot('xi6r3hZe5Tg', 'Inside Singapore, one of the most ambitious cities on Earth.'),
    ],
    shows: [
      show('BBC Africa Eye', 'BBC News Africa', [
        ['K64_vALHLzo', 'Nigeria: Faith, Fear and Fake News'],
        ['95ABSqRpy74', 'Not Our War: Africans Fleeing Ukraine'],
        ['InpJ0vJ8c4I', 'Goodbye Raila'],
      ]),
      show('Witness', 'Al Jazeera English', [
        ['c4--3q6iAa8', 'Japan’s Black Samurai'],
        ['fiBMVkRahxQ', 'A Boy Investigates His Father’s Death in Kenya'],
        ['yq2hHZLssL4', 'The Legacy of Germany’s Colonial Rule in Africa'],
        ['zLb5Mq-cyOo', 'African Migrants on the Road to Europe'],
      ]),
      show('DW Documentary', 'DW Documentary', [
        ['ifEJnQLaMvk', 'Cargo Sailboats: A Sea Change for Shipping?'],
        ['eRpZmhULTDk', 'Bangladesh: Fleeing the Floods'],
        ['6OIhk5QBAS8', 'Greece’s Mobile Hospital'],
        ['ojOdB-7Dbdg', 'Artificial Intelligence and Psychotherapy'],
        ['gqFO7GvK_t0', 'Bodybuilders in East Germany'],
        ['M0cDGeD8bLs', 'Washington, D.C.’s Hidden Worlds'],
      ]),
      show('National Geographic', 'National Geographic', [
        ['xi6r3hZe5Tg', 'City of the Future: Singapore'],
        ['Ap8jTCMK3c4', 'Hostile Planet: Jungles'],
        ['eTEdKrJ1DhI', 'Lost in the Bermuda Triangle'],
        ['r10g5gERB04', 'The Wonder of America’s National Parks'],
      ]),
      show('FRONTLINE', 'FRONTLINE PBS', [
        ['WG1aY5OOR2o', 'How the World’s Deadliest Ebola Outbreak Unfolded'],
        ['7yDSoRPnoIs', 'Pablo Escobar: The Godfather of Cocaine'],
        ['V8I2b1TK2EY', 'Scammed: Investigating the Online Scam Epidemic'],
        ['kaUemcqIQ-k', 'United States of Secrets, Part One'],
      ]),
    ],
  },
  {
    id: 'masterclasses',
    label: 'Masterclass',
    spotlight: [
      spot('4EvkzXMPGns', 'Alfonso Cuarón on writing for the screen, from Y Tu Mamá También to Roma.'),
      spot('UIJUgnykkOA', 'Chanel’s global CEO Leena Nair on leading with purpose, at Stanford.'),
      spot('Co6Qv1aMa3U', 'Grammy-winning engineer Yáng Tan breaks down how he mixes records.'),
    ],
    shows: [
      show('BAFTA Screenwriters’ Lecture', 'BAFTA', [
        ['tFve2KjZFvA', 'Sean Baker'],
        ['B-3ozJZ4zWs', 'Taika Waititi'],
        ['4EvkzXMPGns', 'Alfonso Cuarón'],
        ['XIz_7A2F5u0', 'Noah Baumbach'],
        ['eRfXcWT_oFs', 'Charlie Kaufman'],
      ]),
      show('View From The Top', 'Stanford Graduate School of Business', [
        ['UIJUgnykkOA', 'Leena Nair, Global CEO, Chanel'],
        ['r1Bi10Xt0fc', 'Aravind Srinivas, Cofounder of Perplexity'],
        ['GuF14oKon8A', 'Ken Griffin, Founder of Citadel'],
        ['9-tjY-DG5-0', 'Ajay Banga on Taking Risks in Your Career'],
      ]),
      show('Mixing Masterclass', 'SonicScoop', [
        ['Co6Qv1aMa3U', 'Yáng Tan: J. Cole, NIKI, Janelle Monáe'],
        ['Zk6o1l6Pt9c', 'Andrew Scheps: Adele, Jay-Z, Red Hot Chili Peppers'],
      ]),
      show('How to Start a Startup', 'Y Combinator', [
        ['sz_LgBAGYyo', 'How to Build Products Users Love with Kevin Hale'],
        ['ii1jcLg-eIQ', 'Before the Startup with Paul Graham'],
        ['CBYhVcO4WgI', 'How to Start a Startup with Sam Altman and Dustin Moskovitz'],
      ]),
      show('Film Masterclasses', 'BFI and IFTA', [
        ['-WHJKgZxMQ4', 'Ryan Coogler for the BFI Film Academy'],
        ['xA7RPI9C1IQ', 'Chloé Zhao on Directing'],
      ]),
      show('Cook With Gordon', 'Gordon Ramsay', [
        ['2Ubrg8Ri1-M', 'The Ultimate Steak and Eggs with Matthew McConaughey'],
        ['BHcyuzXRqLs', '50 Cooking Tips'],
      ]),
      show('Hip Hop Production', 'Waves Audio', [['0C3kVyxZ11A', 'Focus... on Producing for Dr. Dre and Kendrick Lamar']]),
      show('Learn Photography', 'Chris Bray Photography', [['LxO-6rlihSg', 'The Complete Course']]),
    ],
  },
  {
    id: 'podcasts',
    label: 'Podcast',
    spotlight: [
      spot('NR6Xzl8TeZE', 'FK Abudu and Jollz sit down with KieKie on how to win online, and keep winning.'),
      spot('ydidoWn8bn8', 'Chude Jideonwo in conversation with actor Omowunmi Dada.'),
      spot('iwDAhq--0Fw', 'Odumeje on 30 years of ministry, the controversies and his family.'),
    ],
    shows: [
      show('I Said What I Said', 'I Said What I Said Podcast', [
        ['NR6Xzl8TeZE', 'The Influencer Playbook ft. KieKie'],
        ['wamZGjv2Oww', 'What Women Face in Politics and Society in Nigeria'],
        ['NNCpBcryfqs', 'What to Do When Your Friend Picks a Man Over You'],
        ['JOj25VemZ5w', 'The Older We Get, the Thicker the Plot ft. Arike Alaso'],
        ['tMuWVSwUdHo', 'How to Build a Global Skincare Brand ft. Ifedayo Agoro'],
        ['_rzzdetu1Ws', 'The Dangerous Business of Telling the Truth ft. Fisayo Soyombo'],
      ]),
      show('With Chude', 'With Chude', [
        ['ydidoWn8bn8', 'Omowunmi Dada'],
        ['9yJw-fJAsm8', 'Oritsefemi'],
        ['w9o0MfwB7SA', 'Jim Iyke'],
        ['WpQsP7KsGl4', 'Peter Obi'],
        ['H4sxbmM-W_A', 'My Girlfriend Cheated and I Still Begged Her to Stay'],
      ]),
      show('The Honest Bunch', 'Glitch Africa', [
        ['R1hYK7p3EkE', 'Carter Efe and Kolu’s Crazy Rise'],
        ['iwDAhq--0Fw', 'Odumeje: The Man Behind Indaboski'],
        ['3IHVNGK3dic', 'Okey Bakassi on Relationships and Success'],
        ['xOsjNrX77tg', 'What Do Men Really Want?'],
        ['P9u8lMT7Tu8', 'Changing the Rules ft. Dr Olakunle Soriyan'],
        ['Z5gPb8lvtNE', 'The Gospel According to Dr Abel Damina'],
      ]),
      show('The Receipts Podcast', 'The Receipts Podcast', [
        ['xPpsz1UDcSY', '10 Years of The Receipts Podcast'],
        ['QK_xf_KVNiU', 'Desperate to Be Married?'],
        ['No4l3ocAJl0', 'Throwback ft. Tiwa Savage'],
        ['HBVeSzs23BA', 'Can I Ask My Ex to Leave? ft. Nadia Jae'],
        ['MnhJh3fBmgs', 'Black Don’t Crack'],
        ['0MXRz3XQmbk', 'What’s Your Unpopular Opinion?'],
      ]),
      show('The Diary of a CEO', 'The Diary Of A CEO', [
        ['6VTSAs4Rsck', 'Mark Cuban: The Brutal Truth About the Next Market Crash'],
        ['UhzI1fg8rCA', 'Druski: They’re Lying to You About Overnight Success'],
        ['Q-DFC0AnbY4', 'Dana White on Building a Business'],
        ['yePLuwL3FbM', 'Get an Hour Back Every Day'],
        ['GlaSnROMqRY', 'The Deathbed Doctor'],
      ]),
      show('On Purpose with Jay Shetty', 'Jay Shetty Podcast', [
        ['XJIKMZpzYeM', 'Matthew McConaughey: Life Got Easy After I Learned This'],
        ['pO2MP_HTjrM', 'Leila Hormozi on Insecurity'],
        ['OqyO8VbWpkA', 'How to Find Your Purpose'],
        ['uRQAhWZ1bxs', 'Mastering Every Conversation'],
      ]),
    ],
  },
  {
    id: 'music',
    label: 'Music',
    spotlight: [
      spot('xaaYgVRZTnE', 'Burna Boy takes over the Tiny Desk with a full band.'),
      spot('lIp-OwMozKI', 'Asake with a full orchestra: Red Bull Symphonic, start to finish.'),
      spot('YleSYAEYdrg', 'Tems, live and close-up behind NPR’s desk.'),
    ],
    shows: [
      show('Tiny Desk Concerts', 'NPR Music', [
        ['xaaYgVRZTnE', 'Burna Boy'],
        ['eo0UxS6lnjA', 'Asake'],
        ['YleSYAEYdrg', 'Tems'],
        ['h4JVg4JDxMU', 'Ayra Starr'],
        ['DHjczZIxr_0', 'Omah Lay'],
      ]),
      show('A COLORS SHOW', 'COLORS', [
        ['OgANUQcPDiQ', 'Rema: Bad Commando'],
        ['laUkWW4k7MU', 'Fireboy DML: hell and back'],
        ['3yAXalCzfiI', 'Omah Lay: Don’t Love Me'],
        ['t5_TBOjKWf8', 'Tiwa Savage: Attention'],
      ]),
      show('Red Bull Symphonic', 'ASAKE', [['lIp-OwMozKI', 'Asake, Full Performance']]),
      show('Rockpalast', 'WDR Rockpalast', [['0EGWd5yWbvU', 'Wizkid Live, 2019']]),
    ],
  },
  {
    id: 'education',
    label: 'Education & Tutorial',
    spotlight: [
      spot('Vl0H-qTclOg', 'Microsoft Excel from zero: the complete beginner’s course.'),
      spot('3ez10ADR_gM', 'Crash Course Economics: how money, markets and trade really work.'),
      spot('Llnmf5BXLBA', 'Design anything in Canva, in one free two-hour class.'),
    ],
    shows: [
      show('Crash Course Economics', 'CrashCourse', [
        ['Dugn51K_6WA', 'Money and Finance'],
        ['g9aDizJpd_s', 'Supply and Demand'],
        ['NI9TLDIPVcs', 'Specialization and Trade'],
        ['3ez10ADR_gM', 'Intro to Economics'],
      ]),
      show('Financial Literacy', 'Khan Academy', [
        ['xH_IlU7nIRs', 'The Psychology of Money'],
        ['MFCdA2vGVh4', 'Loans and Debt'],
        ['k-RTEIaYvAg', 'Paying Yourself First'],
      ]),
      show('Excel for Beginners', 'freeCodeCamp.org', [['Vl0H-qTclOg', 'Microsoft Excel, Full Course']]),
      show('Canva for Beginners', 'Bring Your Own Laptop', [['Llnmf5BXLBA', 'A Free Two-Hour Masterclass']]),
    ],
  },
  {
    id: 'religion',
    label: 'Religion',
    spotlight: [
      spot('t-wG29TxkEc', 'Sunmisola Agbebi leads a live prophetic worship medley.'),
      spot('Ivb_Nnop4xs', 'Mufti Menk on lessons from the Prophetic household, live in Tanzania.'),
      spot('_DAJOwDWc0U', 'Dunsin Oyekan in prophetic worship and praise at the Throne Room.'),
    ],
    shows: [
      show('NSPPD', 'Pastor Jerry Eze', [
        ['sMChaU7vu8U', 'Surely There Is an End, Day 2'],
        ['mIsJl9O3N14', 'Surely There Is an End, Day 1'],
        ['Eksy_Q2aTBE', 'Furnace of Answers, Day 5'],
      ]),
      show('Mufti Menk', 'Mufti Menk', [
        ['Ivb_Nnop4xs', 'Lessons from the Prophetic Household'],
        ['Zqg_ft2CSk4', 'Solve Your Problems by Going Back to Basics'],
        ['uII03mQC4uU', 'Remembrance of Allah Helps'],
      ]),
      show('Worship', 'Sunmisola Agbebi', [['t-wG29TxkEc', 'Prophetic Worship Medley']]),
      show('The Throne Room', 'RCCG - The Throne Room', [['_DAJOwDWc0U', 'Dunsin Oyekan: Prophetic Worship and Praise']]),
      show('Esther Oji', 'Esther Oji', [['yNqWQ6_a6Fk', 'Worship Compilation']]),
    ],
  },
]

export const category = (id: string) => categories.find((x) => x.id === id)

/* One episode with its show. Placeholder numbering (season 1, the oldest upload as episode 1)
   until the backend sends real seasons and episodes. */
export type Episode = { clip: Clip; show: string; showId: string; season: number; episode: number; single: boolean }
const toEpisodes = (s: Show) => s.items.map((clip, i) => ({ clip, show: s.name, showId: showId(s), season: 1, episode: s.items.length - i, single: s.items.length === 1 }))

/* Each show plays in the same player as Shows and Series, and is bought the same way: a pass per
   show from a public studio, or a subscription to a private one, after its teaser. With several
   uploads it's a series (Episodes panel, Next Episode); with one it plays like a film. Ids are
   prefixed so they never clash with catalogue titles. */
const hash = (x: string) => [...x].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const PASS_PRICES = [1500, 2000, 2500, 3000]
const slug = (x: string) => x.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const showId = (s: Show) => `x-${slug(s.name)}`
export const watchHref = (e: Episode) => (e.single ? `/watch/${e.showId}` : `/watch/${e.showId}?ep=${encodeURIComponent(`S${e.season} · E${e.episode}`)}`)

function showById(id: string) {
  for (const cat of categories) for (const s of cat.shows) if (showId(s) === id) return { cat, show: s }
  return null
}

/* Each publisher is a Circo studio, with the same round monogram logo as the others, so the
   player's studio card, mute/block and the studio page all work for Explore too. */
const studioIdFor = (channel: string) => `x-${slug(channel)}`
const HUES = [['#6a1b9a', '#ec407a'], ['#0d47a1', '#26c6da'], ['#bf360c', '#ffb300'], ['#1b5e20', '#9ccc65'], ['#311b92', '#7c4dff'], ['#880e4f', '#ff7043'], ['#004d40', '#4db6ac']]
function monogram(name: string) {
  const letters = name.replace(/^the\s+/i, '').split(/\s+/).filter((w) => /^[a-z0-9]/i.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
  const [a, b] = HUES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(#g)"/><circle cx="100" cy="100" r="84" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="3"/><text x="100" y="100" dy="0.36em" text-anchor="middle" font-family="Inter, -apple-system, Helvetica, Arial, sans-serif" font-weight="800" font-size="64" letter-spacing="-2" fill="#fff">${letters}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const exploreStudios: Record<string, Studio> = Object.fromEntries(
  categories.flatMap((cat) =>
    cat.shows.flatMap((s) =>
      s.items.map((c) => [
        studioIdFor(c.channel),
        { id: studioIdFor(c.channel), name: c.channel, logo: monogram(c.channel), backdrop: clipThumb(c.id), about: `${cat.label} from ${c.channel}.` },
      ]),
    ),
  ),
)

/* Every episode a studio has published in Explore, for its studio page. */
export const episodesByStudio = (studioId: string) => allEpisodes().filter((e) => studioIdFor(e.clip.channel) === studioId)

export function exploreTitle(id: string): Title | undefined {
  const f = showById(id)
  if (!f) return undefined
  const { cat, show } = f
  const lead = show.items[0]
  const blurb = cat.spotlight.find((sp) => show.items.some((c) => c.id === sp.id))?.blurb ?? `${show.name}, from ${lead.channel}.`
  return {
    id,
    name: show.name,
    kind: show.items.length > 1 ? 'series' : 'show',
    poster: clipThumb(lead.id),
    still: clipThumb(lead.id),
    blurb,
    genre: cat.label,
    origin: 'intl',
    studioId: studioIdFor(lead.channel),
    year: 2026,
    rating: '13+',
    // Same rule as the catalogue: the studio decides pass or subscription.
    access: hash(studioIdFor(lead.channel)) % 2 ? 'public' : 'private',
    passPrice: PASS_PRICES[(hash(id) >>> 3) % PASS_PRICES.length],
  }
}

export function exploreEpisodes(id: string): CatalogEpisode[] | undefined {
  const f = showById(id)
  if (!f) return undefined
  return [...f.show.items].reverse().map((c) => ({ title: c.title, mins: MINS[c.id] ?? 30, videoId: c.id, blurb: `${c.channel}` }))
}

/* Mix shows together (one from each in turn) so a row never reads as one show's list. */
function mix(shows: Show[]): Episode[] {
  const lists = shows.map(toEpisodes)
  const out: Episode[] = []
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (l[i]) out.push(l[i])
  return out
}

/* Rows on a category page: curated-style titles, never one per show or region. After New
   Episodes, the rest are dealt across the rows in turn so each mixes shows and none repeat. */
export type EpisodeRow = { id: string; title: string; items: Episode[] }
const CURATED = [
  { id: 'must-watch', title: 'Must Watch' },
  { id: 'for-you', title: 'Hand Picked for You' },
  { id: 'trending', title: 'Trending Now' },
]
export function rowsFor(cat: Category): EpisodeRow[] {
  const fresh = cat.shows.map((s) => toEpisodes(s)[0])
  const rest = mix(cat.shows).filter((e) => !fresh.includes(e))
  return [
    { id: 'new', title: 'New Episodes', items: fresh },
    ...CURATED.map((r, k) => ({ ...r, items: rest.filter((_, i) => i % CURATED.length === k) })),
  ]
}

/* Every episode across Explore, once each (for Saved for later). */
export function allEpisodes(): Episode[] {
  const seen = new Set<string>()
  return categories.flatMap((c) => c.shows.flatMap(toEpisodes)).filter((e) => !seen.has(e.clip.id) && !!seen.add(e.clip.id))
}

/* Find a video, its category and its episode details, for the player. */
export function findClip(id: string) {
  for (const cat of categories)
    for (const s of cat.shows) {
      const ep = toEpisodes(s).find((e) => e.clip.id === id)
      if (ep) return { clip: ep.clip, cat, show: s, ep }
    }
  return null
}

/* Running time of each upload, in minutes. */
const MINS: Record<string, number> = {
  '-5MBx6Oef1o': 47,
  '-WHJKgZxMQ4': 48,
  '0C3kVyxZ11A': 68,
  '0MXRz3XQmbk': 100,
  '2Ubrg8Ri1-M': 31,
  '3IHVNGK3dic': 171,
  '4EvkzXMPGns': 85,
  '4p1yZgR4F9k': 26,
  '6OIhk5QBAS8': 27,
  '6VTSAs4Rsck': 92,
  '7yDSoRPnoIs': 83,
  '9-tjY-DG5-0': 49,
  '95ABSqRpy74': 26,
  '9yJw-fJAsm8': 45,
  'Ap8jTCMK3c4': 47,
  'AwGzyL5Ia_M': 16,
  'B-3ozJZ4zWs': 69,
  'BHcyuzXRqLs': 20,
  'CBYhVcO4WgI': 44,
  'Co6Qv1aMa3U': 69,
  'Cv9ftqQTN0Y': 25,
  'DvSfdjOh32c': 12,
  'GNRnrKUEnCQ': 29,
  'GlaSnROMqRY': 83,
  'GuF14oKon8A': 42,
  'H4sxbmM-W_A': 30,
  'HBVeSzs23BA': 117,
  'InpJ0vJ8c4I': 33,
  'JOj25VemZ5w': 158,
  'K64_vALHLzo': 28,
  'KCZaSSr5m6o': 9,
  'Kn_BC0VJxoY': 9,
  'LqMzkKPHcVM': 31,
  'LtS4lur6unc': 10,
  'LxO-6rlihSg': 144,
  'M0cDGeD8bLs': 43,
  'MDfqysbdfNg': 55,
  'MUYOB5LosSA': 70,
  'MnhJh3fBmgs': 95,
  'NNCpBcryfqs': 120,
  'NR6Xzl8TeZE': 126,
  'No4l3ocAJl0': 106,
  'OqyO8VbWpkA': 27,
  'P9u8lMT7Tu8': 183,
  'Pepol0GPW2Y': 22,
  'Q-DFC0AnbY4': 88,
  'QK_xf_KVNiU': 90,
  'R1hYK7p3EkE': 94,
  'UIJUgnykkOA': 53,
  'UhzI1fg8rCA': 109,
  'V8I2b1TK2EY': 83,
  'VzyIrzdJPXM': 496,
  'WG1aY5OOR2o': 53,
  'WpQsP7KsGl4': 30,
  'XIz_7A2F5u0': 68,
  'XJIKMZpzYeM': 69,
  'Z5gPb8lvtNE': 149,
  'Zk6o1l6Pt9c': 63,
  'ZplWTxVPH34': 41,
  '_rzzdetu1Ws': 162,
  'ab90EInQbjo': 65,
  'c4--3q6iAa8': 25,
  'cU-Ook_YN-A': 14,
  'dQRFcY8hFmo': 58,
  'eRfXcWT_oFs': 41,
  'eRpZmhULTDk': 51,
  'eTEdKrJ1DhI': 44,
  'erKYH3ixfkM': 14,
  'feiF4mTzfsU': 29,
  'fgH-0FuwshA': 98,
  'fiBMVkRahxQ': 47,
  'gqFO7GvK_t0': 28,
  'i-DS4hrdmyQ': 23,
  'ifEJnQLaMvk': 52,
  'ii1jcLg-eIQ': 48,
  'iwDAhq--0Fw': 89,
  'kaUemcqIQ-k': 113,
  'korbMR6LobM': 6,
  'n3l4hJS0jsc': 38,
  'ojOdB-7Dbdg': 44,
  'pGUhBzSgOxw': 22,
  'pNNC2VqB8rY': 38,
  'pO2MP_HTjrM': 46,
  'r10g5gERB04': 220,
  'r1Bi10Xt0fc': 52,
  'r2HmsqLV70Y': 18,
  'rUdsv7EXPQ4': 65,
  'sz_LgBAGYyo': 48,
  'tFve2KjZFvA': 89,
  'tMuWVSwUdHo': 127,
  'u6Sa7APnUGU': 3264,
  'uRQAhWZ1bxs': 78,
  'uWmxJ9_q8t4': 11,
  'w9o0MfwB7SA': 31,
  'wHctxljqXhE': 41,
  'wamZGjv2Oww': 152,
  'xA7RPI9C1IQ': 89,
  'xOsjNrX77tg': 111,
  'xPpsz1UDcSY': 90,
  'xi6r3hZe5Tg': 44,
  'ydidoWn8bn8': 59,
  'yePLuwL3FbM': 135,
  'yq2hHZLssL4': 47,
  'zLb5Mq-cyOo': 25,
}
