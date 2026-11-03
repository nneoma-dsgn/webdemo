'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { icons } from '../data/catalog'

/* "Discovery shelf": heading with chevron plus a horizontal rail.
   On web the rail gets Netflix-style paging arrows on hover. */
export function Shelf({ title, to, tag, backdrop, children }: { title: string; to?: string; tag?: string; backdrop?: ReactNode; children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  const update = () => {
    const el = rail.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const page = (dir: 1 | -1) => {
    const el = rail.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  const heading = (
    <>
      <h2 className="shelf__title">{title}</h2>
      {tag && <span className="shelf__tag">{tag}</span>}
      {to && <img className="shelf__chevron" src={icons.chevronRight} alt="" width={20} height={20} />}
    </>
  )

  return (
    <section className={`shelf${backdrop ? ' shelf--backdrop' : ''}`}>
      {backdrop}
      {to ? (
        <Link href={to} className="shelf__head">
          {heading}
        </Link>
      ) : (
        <div className="shelf__head">{heading}</div>
      )}
      <div className="shelf__body">
        <button className="shelf__arrow shelf__arrow--l" hidden={edge.start} onClick={() => page(-1)} aria-label={`Scroll ${title} back`}>
          <img src={icons.chevronLeft} alt="" width={24} height={24} />
        </button>
        <div className="rail" ref={rail} onScroll={update}>
          {children}
        </div>
        <button className="shelf__arrow shelf__arrow--r" hidden={edge.end} onClick={() => page(1)} aria-label={`Scroll ${title} forward`}>
          <img src={icons.chevronRight} alt="" width={20} height={20} />
        </button>
      </div>
    </section>
  )
}
