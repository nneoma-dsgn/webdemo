'use client'

import { useEffect, type RefObject } from 'react'
import { isPhone } from './viewport'

/* Drag a phone bottom sheet down to dismiss it. The sheet follows the finger (and the dimmed
   backdrop fades with it); let go past a third of its height, or flick it, and it slides away
   and closes. Otherwise it springs back. A drag only starts when the sheet's content is
   scrolled to the top, so scrolling a long sheet still works. */
const START = 8 // px of movement before deciding it's a drag
const FLICK = 0.6 // px per ms
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'

export function useSheetDrag(ref: RefObject<HTMLElement | null>, onClose: () => void, opts: { enabled?: boolean; backdrop?: () => HTMLElement | null } = {}) {
  const { enabled = true, backdrop } = opts
  useEffect(() => {
    const el = ref.current
    // The sideways player turns its menus into a side panel; that one isn't dragged.
    if (!el || !enabled || !isPhone() || document.body.classList.contains('vp-rotated')) return
    let startX = 0
    let startY = 0
    let startT = 0
    let dy = 0
    let tracking = false
    let dragging = false

    // Is anything between the touch and the sheet scrolled down? Then the finger scrolls it.
    const scrolled = (t: EventTarget | null) => {
      for (let n = t as HTMLElement | null; n && n !== el.parentElement; n = n.parentElement) if (n.scrollTop > 0) return true
      return false
    }
    const setBackdrop = (o: string, transition: string) => {
      const b = backdrop?.()
      if (!b) return
      b.style.transition = transition
      b.style.opacity = o
    }

    const down = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      tracking = !scrolled(e.target)
      dragging = false
      dy = 0
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startT = performance.now()
    }
    const move = (e: TouchEvent) => {
      if (!tracking) return
      const d = e.touches[0].clientY - startY
      const dx = e.touches[0].clientX - startX
      if (!dragging) {
        if (d > START && d > Math.abs(dx)) {
          dragging = true
          el.style.transition = 'none'
        } else if (d < -START || Math.abs(dx) > START) {
          tracking = false
          return
        } else return
      }
      dy = Math.max(0, d)
      el.style.transform = `translateY(${dy}px)`
      setBackdrop(String(Math.max(0, 1 - dy / el.offsetHeight)), 'none')
      e.preventDefault()
    }
    const up = () => {
      tracking = false
      if (!dragging) return
      dragging = false
      const speed = dy / Math.max(1, performance.now() - startT)
      el.style.transition = `transform 0.22s ${EASE}`
      if (dy > el.offsetHeight / 3 || speed > FLICK) {
        el.style.transform = 'translateY(110%)'
        setBackdrop('0', 'opacity 0.22s ease')
        window.setTimeout(onClose, 200)
      } else {
        el.style.transform = ''
        setBackdrop('', 'opacity 0.22s ease')
      }
    }

    el.addEventListener('touchstart', down, { passive: true })
    // Not passive: a drag stops the page behind from scrolling.
    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', up)
    el.addEventListener('touchcancel', up)
    return () => {
      el.removeEventListener('touchstart', down)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', up)
      el.removeEventListener('touchcancel', up)
    }
  }, [ref, onClose, enabled, backdrop])
}
