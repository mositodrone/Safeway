// lib/scrollToHash.ts
//
// Manual smooth-scroll for in-page anchor links, used instead of relying on
// Next.js <Link>'s built-in hash handling — that internal scroll call doesn't
// consistently respect the `scroll-behavior: smooth` CSS property across
// Next.js versions, which is why anchor clicks were jumping instead of
// smoothly scrolling even with the global CSS rule in place.
//
// scrollIntoView() honours each target's `scroll-margin-top` automatically,
// so the scroll-mt-24 already on each section still keeps content clear of
// the sticky navbar — no manual offset math needed here.

export function scrollToHash(href: string) {
  const hashIndex = href.indexOf('#')
  if (hashIndex === -1) return

  const id = href.slice(hashIndex + 1)
  const el = document.getElementById(id)
  if (!el) return

  el.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Keep the URL in sync without triggering a jump or a reload.
  history.replaceState(null, '', `#${id}`)
}
