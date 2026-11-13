'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { idForName, isSaved, savedToast, toggleSaved } from '../data/saved'
import { isPhone } from './viewport'
import { Icon, type IconName } from './Icon'

/* One dropdown for the whole app (card ⋯ menus, right-click, account menu) plus the toast.
   Open it with a title (the standard title menu) or a full spec of header + items. */

export type MenuItem =
  | { kind?: 'item'; id: string; label: string; icon?: IconName; hint?: string; danger?: boolean; chevron?: boolean; onSelect?: () => void }
  | { kind: 'separator'; id: string }

/* align 'start' drops the menu from the button's left edge (tab dropdowns); the default is
   right-aligned to the button (⋯ and account menus). */
export type MenuSpec = { label: string; header?: ReactNode; items: MenuItem[]; align?: 'start' | 'end' }

type Anchor = HTMLElement | { x: number; y: number }
type Ctx = { open: (anchor: Anchor, menu: string | MenuSpec) => void; close: () => void; toast: (msg: string) => void }

const MenuCtx = createContext<Ctx>({ open: () => {}, close: () => {}, toast: () => {} })
export const useMenu = () => useContext(MenuCtx)

const MENU_W = 272
const GAP = 8
const EDGE = 12

type Placed = { spec: MenuSpec; x: number; y: number; origin: string; anchor: HTMLElement | null; anchorTop: number; anchorBottom: number }

/* The standard menu for a title: what every card ⋯ and right-click shows. */
function titleMenu(name: string, toast: (m: string) => void): MenuSpec {
  return {
    label: `${name} options`,
    header: <span className="dd__title">{name}</span>,
    items: [
      isSaved(idForName(name))
        ? { id: 'later', label: 'Saved for later', icon: 'check', onSelect: () => toast(savedToast(toggleSaved(idForName(name)))) }
        : { id: 'later', label: 'Watch later', icon: 'bookmark', onSelect: () => toast(savedToast(toggleSaved(idForName(name)))) },
      { id: 'share', label: 'Share', icon: 'share', onSelect: () => toast('Link copied') },
    ],
  }
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<Placed | null>(null)
  const current = useRef<Placed | null>(null)
  current.current = menu
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
      // Pressing the same button again closes its menu.
      if (el && current.current?.anchor === el) {
        setMenu(null)
        return
      }
      const start = spec.align === 'start'
      let x: number, top: number, bottom: number
      if (el) {
        const r = el.getBoundingClientRect()
        x = start ? r.left : r.right - MENU_W
        top = r.top
        bottom = r.bottom
      } else {
        const p = anchor as { x: number; y: number }
        x = p.x
        top = bottom = p.y
      }
      x = Math.max(EDGE, Math.min(x, window.innerWidth - MENU_W - EDGE))
      // Placed below first; the dropdown flips above after measuring if it doesn't fit.
      setMenu({ spec, x, y: bottom + GAP, origin: el && !start ? 'top right' : 'top left', anchor: el, anchorTop: top, anchorBottom: bottom })
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

/* Phones get every menu as a bottom sheet (grabber, full-width rows, dimmed page behind). */
function Dropdown({ placed, onClose }: { placed: Placed; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [sheet] = useState(isPhone)
  const [pos, setPos] = useState({ y: placed.y, origin: placed.origin })

  // Flip above the anchor when there isn't room below.
  useLayoutEffect(() => {
    if (sheet) return
    const h = ref.current?.offsetHeight ?? 0
    if (placed.anchorBottom + GAP + h > window.innerHeight - EDGE) {
      setPos({ y: Math.max(EDGE, placed.anchorTop - GAP - h), origin: placed.origin.replace('top', 'bottom') })
    }
  }, [placed, sheet])

  useEffect(() => {
    const items = () => Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('.dd__item') ?? [])
    items()[0]?.focus({ preventScroll: true })
    const dismiss = (restore = false) => {
      onClose()
      if (restore) placed.anchor?.focus({ preventScroll: true })
    }
    const onDown = (e: MouseEvent) => {
      // The menu's own button toggles it in open(), so a press on it isn't an outside click.
      if (ref.current?.contains(e.target as Node) || placed.anchor?.contains(e.target as Node)) return
      dismiss()
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
    // A sheet covers the page, so scrolling behind it doesn't close it.
    if (!sheet) {
      window.addEventListener('scroll', onScroll, true)
      window.addEventListener('resize', onScroll)
    }
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [onClose, placed, sheet])

  const { spec } = placed
  // Ticks sit at the right end of a row; only other icons get a column on the left.
  const hasIcons = spec.items.some((it) => it.kind !== 'separator' && it.icon && it.icon !== 'check')

  const body = (
    <div ref={ref} className={`dd${sheet ? ' dd--sheet' : ''}`} role="menu" aria-label={spec.label} style={sheet ? undefined : { left: placed.x, top: pos.y, width: MENU_W, transformOrigin: pos.origin }}>
      {sheet && <span className="dd__grab" aria-hidden />}
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
            {/* The icon column only exists when some row in this menu has an icon (keeps ticks aligned). */}
            {hasIcons && (
              <span className="dd__icon" aria-hidden>
                {it.icon && it.icon !== 'check' && <Icon name={it.icon} size={17} />}
              </span>
            )}
            <span className="dd__label">{it.label}</span>
            {it.hint && <span className="dd__hint">{it.hint}</span>}
            {it.icon === 'check' && (
              <span className="dd__icon dd__tick" aria-hidden>
                <Icon name="check" size={17} />
              </span>
            )}
            {it.chevron && (
              <svg className="dd__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 6l6 6-6 6" />
              </svg>
            )}
          </button>
        ),
      )}
    </div>
  )
  return sheet ? (
    <>
      <div className="dd-scrim" aria-hidden />
      {body}
    </>
  ) : (
    body
  )
}
