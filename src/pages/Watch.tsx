import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { icons, titles } from '../data/catalog'
import { useMenu } from '../components/Menu'

const DURATION = 52 * 60 + 14

const fmt = (s: number) => {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/* Web version of "Play Video": full-bleed stage, controls fade out while playing. */
export default function Watch() {
  const { id = 'dune' } = useParams()
  const [params] = useSearchParams()
  const t = titles[id] ?? titles.dune
  const navigate = useNavigate()
  const { toast } = useMenu()
  const [playing, setPlaying] = useState(true)
  const [time, setTime] = useState(DURATION * 0.02)
  const [idle, setIdle] = useState(false)
  const idleTimer = useRef(0)

  useEffect(() => {
    if (!playing) return
    const tick = window.setInterval(() => setTime((s) => Math.min(DURATION, s + 1)), 1000)
    return () => window.clearInterval(tick)
  }, [playing])

  const wake = () => {
    setIdle(false)
    window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => setIdle(true), 2500)
  }

  useEffect(() => {
    wake()
    const key = (e: KeyboardEvent) => {
      wake()
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        setPlaying((p) => !p)
      }
      if (e.key === 'ArrowRight') setTime((s) => Math.min(DURATION, s + 10))
      if (e.key === 'ArrowLeft') setTime((s) => Math.max(0, s - 10))
      if (e.key === 'Escape') navigate(-1)
    }
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('keydown', key)
      window.clearTimeout(idleTimer.current)
    }
  }, [])

  const ep = params.get('ep')

  return (
    <div className={`player${idle && playing ? ' player--idle' : ''}`} onMouseMove={wake} onClick={wake}>
      <img className="player__frame" src={t.still} alt="" />

      <div className="player__top">
        <button className="back" onClick={() => navigate(-1)} aria-label="Exit player">
          <img src={icons.chevronLeft} alt="" width={24} height={24} />
        </button>
        <div className="player__heading">
          <strong>{t.name}</strong>
          {ep && <span>Episode {ep}</span>}
        </div>
        <button className="icon-btn glass" aria-label="Cast to device" onClick={() => toast('Looking for devices nearby')}>
          <img src={icons.cast} alt="" width={24} height={24} />
        </button>
      </div>

      <button className="player__center" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? (
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
            <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <img src={icons.play} alt="" width={28} height={28} />
        )}
      </button>

      <div className="player__bottom">
        <div className="scrubber">
          <input
            type="range"
            min={0}
            max={DURATION}
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
            aria-label="Seek"
            style={{ ['--p' as string]: `${(time / DURATION) * 100}%` }}
          />
        </div>
        <div className="player__row">
          <span className="player__time">{fmt(time)}</span>
          <div className="player__skips">
            <button className="icon-btn" onClick={() => setTime((s) => Math.max(0, s - 10))} aria-label="Back 10 seconds">
              <SkipGlyph dir={-1} />
            </button>
            <button className="icon-btn" onClick={() => setTime((s) => Math.min(DURATION, s + 10))} aria-label="Forward 10 seconds">
              <SkipGlyph dir={1} />
            </button>
          </div>
          <span className="player__time">-{fmt(DURATION - time)}</span>
        </div>
      </div>
    </div>
  )
}

function SkipGlyph({ dir }: { dir: 1 | -1 }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={dir === 1 ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="600" style={dir === 1 ? { transform: 'scaleX(-1)', transformOrigin: '12px 12px' } : undefined}>
        10
      </text>
    </svg>
  )
}
