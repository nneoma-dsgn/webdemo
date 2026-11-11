'use client'

import { useEffect } from 'react'

/* Thumbnails that fail to load (portrait posters, landscape stills, episode art) show the
   standard placeholder instead of a broken image: the frame keeps its shape and gets the grey
   picture icon (.img-fallback in ui.css). One listener covers every image in the app, including
   ones that failed before the page finished loading. Small icons and logos are left alone. */
function mark(img: HTMLImageElement) {
  const frame = img.parentElement
  if (!frame || img.width < 40) return
  frame.classList.add('img-fallback')
  img.classList.add('img-fallback__img')
}

export function ImageFallback() {
  useEffect(() => {
    const onError = (e: Event) => e.target instanceof HTMLImageElement && mark(e.target)
    // A retry or a new src that loads fine clears the placeholder.
    const onLoad = (e: Event) => {
      const img = e.target
      if (!(img instanceof HTMLImageElement) || !img.classList.contains('img-fallback__img')) return
      img.classList.remove('img-fallback__img')
      img.parentElement?.classList.remove('img-fallback')
    }
    window.addEventListener('error', onError, true)
    window.addEventListener('load', onLoad, true)
    document.querySelectorAll('img').forEach((img) => img.complete && img.naturalWidth === 0 && img.src && mark(img))
    return () => {
      window.removeEventListener('error', onError, true)
      window.removeEventListener('load', onLoad, true)
    }
  }, [])
  return null
}
