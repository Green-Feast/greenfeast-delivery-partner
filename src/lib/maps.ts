import type { Stop } from './api'

// Google Maps links: they open the Google Maps app on the phone when it's
// installed. No API key needed.

function target(s: Stop) {
  return s.lat != null && s.lng != null ? `${s.lat},${s.lng}` : `${s.address}, Jaipur${s.pincode ? ' ' + s.pincode : ''}`
}

export function navigateUrl(s: Stop) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target(s))}`
}

// Google Maps takes the destination plus up to 9 stops on the way.
export function routeUrl(stops: Stop[]) {
  const pts = stops.slice(0, 10).map(target)
  const dest = pts.pop()!
  const via = pts.length > 0 ? `&waypoints=${encodeURIComponent(pts.join('|'))}` : ''
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}${via}`
}

export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const x = (b.lng - a.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180))
  const y = b.lat - a.lat
  return Math.sqrt(x * x + y * y) * 111.32
}

// Nearest stop first from `from`, then nearest to that; stops with no pin last.
export function nearestFirst(stops: Stop[], from: { lat: number; lng: number }): Stop[] {
  const left = stops.filter((s) => s.lat != null && s.lng != null)
  const noPin = stops.filter((s) => s.lat == null || s.lng == null)
  const route: Stop[] = []
  let at = from
  while (left.length > 0) {
    let best = 0
    for (let i = 1; i < left.length; i++) {
      if (km(at, { lat: left[i].lat!, lng: left[i].lng! }) < km(at, { lat: left[best].lat!, lng: left[best].lng! })) best = i
    }
    const [next] = left.splice(best, 1)
    route.push(next)
    at = { lat: next.lat!, lng: next.lng! }
  }
  return [...route, ...noPin]
}
