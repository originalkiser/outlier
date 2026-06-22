import { useEffect, useState } from 'react'

const POLL_MS = 5 * 60 * 1000 // 5 minutes

export function useUpdateAvailable(): boolean {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    // Capture the src of the currently-running module script
    const currentEl = document.querySelector<HTMLScriptElement>('script[type=module][src]')
    const currentSrc = currentEl?.getAttribute('src') ?? ''
    if (!currentSrc) return

    async function check() {
      try {
        const base = import.meta.env.BASE_URL ?? '/'
        const res = await fetch(base, { cache: 'no-store' })
        if (!res.ok) return
        const html = await res.text()
        // Strip origin so we compare just the path
        const srcPath = currentSrc.replace(/^https?:\/\/[^/]+/, '')
        if (srcPath && !html.includes(srcPath)) {
          setAvailable(true)
        }
      } catch {
        // network error — silently ignore
      }
    }

    // First check after 1 min (avoid false positive on cold load)
    const initial = setTimeout(check, 60_000)
    const poll = setInterval(check, POLL_MS)
    return () => { clearTimeout(initial); clearInterval(poll) }
  }, [])

  return available
}
