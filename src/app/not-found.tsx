import { redirect } from 'next/navigation'

/* Unknown routes (including old /title and /watch links) go home. */
export default function NotFound() {
  redirect('/')
}
