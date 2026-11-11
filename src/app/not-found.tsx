import { ButtonLink, EmptyState } from '@/components/ui'

/* Unknown pages, titles, studios and shelves land here (a bad or old link), never on a
   stand-in title. */
export default function NotFound() {
  return (
    <main className="page page--padded notfound">
      <EmptyState
        icon={<img src="/assets/icon-search.svg" alt="" />}
        action={
          <ButtonLink href="/" size="lg">
            Go Home
          </ButtonLink>
        }
      >
        We couldn’t find that page.
        <br />
        The link may be wrong, or it’s no longer on Circo.
      </EmptyState>
    </main>
  )
}
