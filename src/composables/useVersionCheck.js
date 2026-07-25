import { ref, onMounted, onUnmounted } from 'vue'

export function useVersionCheck(intervalMs = 5 * 60 * 1000) {
  const newVersionAvailable = ref(false)
  let timer = null
  let initialSrcs = null

  function getCurrentScriptSrcs() {
    return new Set(
      Array.from(document.querySelectorAll('script[src]'))
        .map(s => s.getAttribute('src'))
        .filter(Boolean)
    )
  }

  async function checkVersion() {
    try {
      const res = await fetch('./', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      })
      if (!res.ok) return
      const html = await res.text()
      const matches = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)]
      if (matches.length === 0) return
      const fetchedFiles = new Set(matches.map(m => m[1].split('/').pop().split('?')[0]))
      const currentFiles = new Set([...initialSrcs].map(s => s.split('/').pop().split('?')[0]))
      const hasMatch = [...fetchedFiles].some(f => currentFiles.has(f))
      if (!hasMatch) {
        newVersionAvailable.value = true
        clearInterval(timer)
      }
    } catch (e) {}
  }

  onMounted(() => {
    if (import.meta.env.DEV) return
    initialSrcs = getCurrentScriptSrcs()
    if (initialSrcs.size > 0) {
      timer = setInterval(checkVersion, intervalMs)
    }
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { newVersionAvailable }
}
