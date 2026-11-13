/* Circo's line icons: one set of named shapes, drawn by one component at whatever size and
   weight a place needs. Shapes are on a 24-unit grid (Lucide style) unless they say otherwise;
   house and search come from the mobile design's icon files on a 28-unit grid. */

type Shape = string[] | { grid: number; d: string[] }

export const ICON_PATHS = {
  // Moving around
  'arrow-left': ['M19 12H5', 'm12 19-7-7 7-7'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 6l6 6-6 6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  alert: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', 'M12 9v4', 'M12 17h.01'],
  house: { grid: 28, d: ['M17.5 24.4991V15.1657C17.5 14.8563 17.3771 14.5596 17.1583 14.3408C16.9395 14.122 16.6428 13.9991 16.3333 13.9991H11.6667C11.3572 13.9991 11.0605 14.122 10.8417 14.3408C10.6229 14.5596 10.5 14.8563 10.5 15.1657V24.4991M3.5 11.6663C3.49992 11.3269 3.57389 10.9915 3.71675 10.6836C3.85962 10.3757 4.06793 10.1027 4.32717 9.88363L12.4938 2.88363C12.915 2.52769 13.4486 2.3324 14 2.3324C14.5514 2.3324 15.085 2.52769 15.5062 2.88363L23.6728 9.88363C23.9321 10.1027 24.1404 10.3757 24.2832 10.6836C24.4261 10.9915 24.5001 11.3269 24.5 11.6663V22.1663C24.5 22.7851 24.2542 23.3786 23.8166 23.8162C23.379 24.2538 22.7855 24.4996 22.1667 24.4996H5.83333C5.21449 24.4996 4.621 24.2538 4.18342 23.8162C3.74583 23.3786 3.5 22.7851 3.5 22.1663V11.6663Z'] },
  library: ['M16 6l4 14', 'M12 6v14', 'M8 8v12', 'M4 4v16'],
  search: ['M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0z', 'm21 21-5.2-5.2'],
  'search-nav': { grid: 28, d: ['M24.5002 24.5002L19.4369 19.4369M22.1667 12.8333C22.1667 17.988 17.988 22.1667 12.8333 22.1667C7.67868 22.1667 3.5 17.988 3.5 12.8333C3.5 7.67868 7.67868 3.5 12.8333 3.5C17.988 3.5 22.1667 7.67868 22.1667 12.8333Z'] },

  // Account and menus
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'],
  help: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h.01'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  wallet: ['M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'],
  phone: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M12 18h.01'],
  computer: ['M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M8 21h8', 'M12 17v4'],
  tv: ['M4 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z', 'M17 2l-5 5-5-5'],
  flag: ['M4 22V4', 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1'],
  bookmark: ['M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  share: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
  block: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M4.93 4.93l14.14 14.14'],

  // Playback
  cast: ['M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6', 'M2 12a9 9 0 0 1 8 8', 'M2 16a5 5 0 0 1 4 4', 'M2 20h.01'],
  pip: ['M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5', 'M14 14h7v6h-7z'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  expand: ['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3'],
  collapse: ['M8 3v3a2 2 0 0 1-2 2H3', 'M21 8h-3a2 2 0 0 1-2-2V3', 'M3 16h3a2 2 0 0 1 2 2v3', 'M16 21v-3a2 2 0 0 1 2-2h3'],
  volume: ['M11 5L6 9H2v6h4l5 4V5z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M19 5a10 10 0 0 1 0 14'],
  mute: ['M11 5 6 9H2v6h4l5 4V5z', 'M22 9l-6 6', 'M16 9l6 6'],
  subtitles: ['M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'M7 13h3', 'M13 13h4', 'M7 16h8'],
  'skip-next': ['M6 4l10 8-10 8V4z', 'M19 5v14'],
  replay: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
  wifi: ['M5 12.55a11 11 0 0 1 14.08 0', 'M1.42 9a16 16 0 0 1 21.16 0', 'M8.53 16.11a6 6 0 0 1 6.95 0', 'M12 20h.01'],
} satisfies Record<string, Shape>

export type IconName = keyof typeof ICON_PATHS

/* size: rendered px. weight: line width on the 24-unit grid (shapes on other grids are scaled
   so they draw at the same weight). */
export function Icon({ name, size = 24, weight = 1.8, className }: { name: IconName; size?: number; weight?: number; className?: string }) {
  const shape: Shape = ICON_PATHS[name]
  const { grid, d } = Array.isArray(shape) ? { grid: 24, d: shape } : shape
  return (
    <svg className={className} width={size} height={size} viewBox={`0 0 ${grid} ${grid}`} fill="none" stroke="currentColor" strokeWidth={(weight * grid) / 24} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  )
}
