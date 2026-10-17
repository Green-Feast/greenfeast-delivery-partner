import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { WEB_URL } from '@/lib/config'
import { MAP_HTML, type MapData } from './mapHtml'

// Phones: the Leaflet map in a WebView (no Google Maps key to manage, and
// nothing native that can crash the app if a key is missing).
export default function RouteMap({ data, onPick }: { data: MapData; onPick: (key: string) => void }) {
  const ref = useRef<WebView>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(`window.setStops(${JSON.stringify(data)}); true;`)
  }, [ready, data])

  return (
    <View style={s.box}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        // A real origin, so map tile requests say where they come from.
        source={{ html: MAP_HTML, baseUrl: WEB_URL }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data)
            if (m.type === 'ready') setReady(true)
            else if (m.type === 'pick') onPick(m.key)
          } catch {
            // not ours
          }
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  box: { height: 460, width: '100%', backgroundColor: '#eef2ea' },
})
