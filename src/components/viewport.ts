/* The phone breakpoint, shared with the stylesheets' @media (max-width: 767px) blocks: anything
   phone-only in script asks here, so the two never drift apart. */
export const PHONE_QUERY = '(max-width: 767px)'

export const isPhone = () => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches
