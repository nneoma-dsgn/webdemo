/* Circo's content categories, as set by the content team: six with subcategories, three
   without. Movie is the Shows tab; every other category is a page under More (data/explore.ts),
   and sign-up interests are picked from the categories (views/Onboarding.tsx). Subcategories
   are kept for tagging titles; they aren't shown to viewers yet. */
export type ContentCategory = { id: string; label: string; subs: string[] }

export const CONTENT_CATEGORIES: ContentCategory[] = [
  { id: 'movie', label: 'Movie', subs: ['Romance', 'Action', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi', 'Family'] },
  { id: 'reality-show', label: 'Reality Show', subs: ['Competition', 'Lifestyle', 'Talent', 'Dating', 'Survival', 'Makeover', 'Social Experiment'] },
  { id: 'micro-drama', label: 'Micro Drama', subs: ['Love Story', 'Workplace', 'Family', 'Revenge', 'Drama', 'Comedy', 'Suspense'] },
  { id: 'documentary', label: 'Documentary', subs: ['True Crime', 'Biography', 'History', 'Culture & Heritage', 'Science & Innovation', 'Nature & Environment', 'Social Impact'] },
  {
    id: 'masterclass',
    label: 'Masterclass',
    subs: ['Beauty & Fashion', 'Business & Entrepreneurship', 'Wellness & Self-Care', 'Lifestyle & Cooking', 'Creative Skills (Art, Makeup, Hair)', 'Personal Development'],
  },
  { id: 'podcast', label: 'Podcast', subs: ['Culture & Society', 'Business & Career', 'Entertainment', 'Lifestyle', 'Relationships', 'Health & Wellness', 'True Stories'] },
  { id: 'music', label: 'Music', subs: [] },
  { id: 'education', label: 'Education & Tutorial', subs: [] },
  { id: 'religion', label: 'Religion', subs: [] },
]
