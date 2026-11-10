/* Skeleton screens shown while a page's code and session load (never in the video player). */

function Rail({ wide }: { wide?: boolean }) {
  return (
    <div className="skel-shelf">
      <span className="skel skel-line" style={{ width: 160 }} />
      <div className="skel-rail">
        {Array.from({ length: wide ? 4 : 8 }, (_, i) => (
          <span key={i} className={`skel ${wide ? 'skel-wide' : 'skel-poster'}`} />
        ))}
      </div>
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div className="skel-page" aria-busy="true" aria-label="Loading">
      <div className="skel skel-hero">
        <div className="skel-hero__copy">
          <span className="skel-line skel-line--lg" style={{ width: '42%' }} />
          <span className="skel-line" style={{ width: '60%' }} />
          <span className="skel-line" style={{ width: '48%' }} />
          <span className="skel-pill" />
        </div>
      </div>
      <div className="skel-shelves">
        <Rail />
        <Rail wide />
        <Rail />
      </div>
    </div>
  )
}

export function GridSkeleton() {
  return (
    <div className="skel-page skel-page--padded" aria-busy="true" aria-label="Loading">
      <div className="skel-grid">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="skel skel-poster" />
        ))}
      </div>
    </div>
  )
}

export function StudioSkeleton() {
  return (
    <div className="skel-page" aria-busy="true" aria-label="Loading">
      <div className="skel skel-hero skel-hero--center">
        <div className="skel-hero__copy skel-hero__copy--center">
          <span className="skel-line skel-line--lg" style={{ width: 320 }} />
          <span className="skel-line" style={{ width: 420 }} />
        </div>
      </div>
      <div className="skel-shelves">
        <Rail />
        <Rail />
      </div>
    </div>
  )
}
