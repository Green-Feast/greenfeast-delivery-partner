import { useEffect, useRef, useState } from 'react'
import { MAP_HTML, type MapData } from './mapHtml'

// Web: the same Leaflet page in an iframe; messages instead of a WebView.
export default function RouteMap({ data, onPick }: { data: MapData; onPick: (key: string) => void }) {
  const frame = useRef<HTMLIFrameElement | null>(null)
  const pick = useRef(onPick)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    pick.current = onPick
  }, [onPick])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== frame.current?.contentWindow) return
      try {
        const m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (m?.type === 'ready') setReady(true)
        else if (m?.type === 'pick') pick.current(m.key)
      } catch {
        // not ours
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage(JSON.stringify({ type: 'stops', ...data }), '*')
  }, [ready, data])

  return <iframe ref={frame} srcDoc={MAP_HTML} title="Route map" style={{ border: 0, width: '100%', height: 460, display: 'block' }} />
}
