'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type MenuState = { x: number; y: number; name: string } | null
type Ctx = { open: (anchor: HTMLElement | { x: number; y: number }, name: string) => void; toast: (msg: string) => void }

const MenuCtx = createContext<Ctx>({ open: () => {}, toast: () => {} })
export const useMenu = () => useContext(MenuCtx)

const OPTIONS = [
  { id: 'later', label: 'Watch later', done: 'Added to Saved for later' },
  { id: 'download', label: 'Download', done: 'Download started' },
  { id: 'share', label: 'Share', done: 'Link copied' },
]

const MENU_W = 220

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuState>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<number>(0)

  const open = useCallback<Ctx['open']>((anchor, name) => {
    let x: number, y: number
    if (anchor instanceof HTMLElement) {
      const r = anchor.getBoundingClientRect()
      x = r.right - MENU_W
      y = r.bottom + 8
    } else {
      ;({ x, y } = anchor)
    }
    x = Math.max(12, Math.min(x, window.innerWidth - MENU_W - 12))
    y = Math.min(y, window.innerHeight - 160)
    setMenu({ x, y, name })
  }, [])

  // The text outlives `shown` so it stays visible while the pill animates out.
  const [shown, setShown] = useState(false)
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

  useEffect(() => {
    if (!menu) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return
      setMenu(null)
    }
    ref.current?.querySelector('button')?.focus()
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  return (
    <MenuCtx.Provider value={{ open, toast }}>
      {children}
      {menu && (
        <div ref={ref} className="menu" role="menu" aria-label={menu.name} style={{ left: menu.x, top: menu.y }}>
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              role="menuitem"
              className="menu__item"
              onClick={() => {
                setMenu(null)
                toast(o.done)
              }}
            >
              <MenuIcon id={o.id} />
              {o.label}
            </button>
          ))}
        </div>
      )}
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

/* Lucide-style glyphs matching the mobile context menu (bookmark, download, share). */
function MenuIcon({ id }: { id: string }) {
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (id === 'later') return <svg {...p}><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
  if (id === 'download') return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
  return <svg {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
}
