'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/* One dropdown for the whole app (card ⋯ menus, right-click, account menu) plus the toast.
   Open it with a title (the standard title menu) or a full spec of header + items. */

export type MenuItem =
  | { kind?: 'item'; id: string; label: string; icon?: IconName; hint?: string; danger?: boolean; onSelect?: () => void }
  | { kind: 'separator'; id: string }

export type MenuSpec = { label: string; header?: ReactNode; items: MenuItem[] }

type Anchor = HTMLElement | { x: number; y: number }
type Ctx = { open: (anchor: Anchor, menu: string | MenuSpec) => void; close: () => void; toast: (msg: string) => void }

const MenuCtx = createContext<Ctx>({ open: () => {}, close: () => {}, toast: () => {} })
export const useMenu = () => useContext(MenuCtx)

const MENU_W = 248
const GAP = 8
const EDGE = 12

type Placed = { spec: MenuSpec; x: number; y: number; origin: string; anchor: HTMLElement | null; anchorTop: number; anchorBottom: number }

/* The standard menu for a title: what every card ⋯ and right-click shows. */
function titleMenu(name: string, toast: (m: string) => void): MenuSpec {
  return {
    label: `${name} options`,
    header: <span className="dd__title">{name}</span>,
    items: [
      { id: 'later', label: 'Watch later', icon: 'bookmark', onSelect: () => toast('Added to Saved for later') },
      { id: 'share', label: 'Share', icon: 'share', onSelect: () => toast('Link copied') },
    ],
  }
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<Placed | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [shown, setShown] = useState(false)
  const timer = useRef(0)

  const toast = useCallback((m: string) => {
    window.clearTimeout(timer.current)
    setShown(false)
    // Restart the entrance even when a toast is already up.
    requestAnimationFrame(() => {
      setMsg(m)
      setShown(true)
    })
    timer.current = window.setTimeout(() => setShown(false), 2600)
  }, [])

  const open = useCallback<Ctx['open']>(
    (anchor, m) => {
      const spec = typeof m === 'string' ? titleMenu(m, toast) : m
      const el = anchor instanceof HTMLElement ? anchor : null
      let x: number, top: number, bottom: number
      if (el) {
        const r = el.getBoundingClientRect()
        x = r.right - MENU_W // right-aligned to the button
        top = r.top
        bottom = r.bottom
      } else {
        const p = anchor as { x: number; y: number }
        x = p.x
        top = bottom = p.y
      }
      x = Math.max(EDGE, Math.min(x, window.innerWidth - MENU_W - EDGE))
      // Placed below first; the dropdown flips above after measuring if it doesn't fit.
      setMenu({ spec, x, y: bottom + GAP, origin: el ? 'top right' : 'top left', anchor: el, anchorTop: top, anchorBottom: bottom })
    },
    [toast],
  )

  const close = useCallback(() => setMenu(null), [])

  return (
    <MenuCtx.Provider value={{ open, close, toast }}>
      {children}
      {menu && <Dropdown key={`${menu.spec.label}-${menu.x}-${menu.y}`} placed={menu} onClose={close} />}
      <div className={`toast${shown ? ' toast--on' : ''}`} role="status" aria-live="polite">
        {msg && (
          <>
            <span className="toast__icon" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            {msg}
          </>
        )}
      </div>
    </MenuCtx.Provider>
  )
}

function Dropdown({ placed, onClose }: { placed: Placed; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ y: placed.y, origin: placed.origin })

  // Flip above the anchor when there isn't room below.
  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight ?? 0
    if (placed.anchorBottom + GAP + h > window.innerHeight - EDGE) {
      setPos({ y: Math.max(EDGE, placed.anchorTop - GAP - h), origin: placed.origin.replace('top', 'bottom') })
    }
  }, [placed])

  useEffect(() => {
    const items = () => Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('.dd__item') ?? [])
    items()[0]?.focus({ preventScroll: true })
    const dismiss = (restore = false) => {
      onClose()
      if (restore) placed.anchor?.focus({ preventScroll: true })
    }
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) dismiss()
    }
    const onKey = (e: KeyboardEvent) => {
      const list = items()
      const i = list.indexOf(document.activeElement as HTMLButtonElement)
      if (e.key === 'Escape') dismiss(true)
      else if (e.key === 'ArrowDown') list[(i + 1) % list.length]?.focus()
      else if (e.key === 'ArrowUp') list[(i - 1 + list.length) % list.length]?.focus()
      else if (e.key === 'Home') list[0]?.focus()
      else if (e.key === 'End') list[list.length - 1]?.focus()
      else if (e.key === 'Tab') dismiss()
      else return
      e.preventDefault()
    }
    const onScroll = () => dismiss()
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [onClose, placed])

  const { spec } = placed
  return (
    <div ref={ref} className="dd" role="menu" aria-label={spec.label} style={{ left: placed.x, top: pos.y, width: MENU_W, transformOrigin: pos.origin }}>
      {spec.header && <div className="dd__header">{spec.header}</div>}
      {spec.items.map((it) =>
        it.kind === 'separator' ? (
          <div key={it.id} className="dd__sep" role="separator" />
        ) : (
          <button
            key={it.id}
            role="menuitem"
            className={`dd__item${it.danger ? ' dd__item--danger' : ''}`}
            onClick={() => {
              onClose()
              it.onSelect?.()
            }}
          >
            <span className="dd__icon" aria-hidden>
              {it.icon && <Icon name={it.icon} />}
            </span>
            <span className="dd__label">{it.label}</span>
            {it.hint && <span className="dd__hint">{it.hint}</span>}
          </button>
        ),
      )}
    </div>
  )
}

/* Lucide glyphs used by menu items. */
export type IconName = 'bookmark' | 'share' | 'user' | 'library' | 'wallet' | 'logout' | 'help'
const ICONS: Record<IconName, string[]> = {
  bookmark: ['M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  share: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  library: ['M16 6l4 14', 'M12 6v14', 'M8 8v12', 'M4 4v16'],
  wallet: ['M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  help: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h.01'],
}

function Icon({ name }: { name: IconName }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
