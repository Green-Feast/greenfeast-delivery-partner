// The batch map: Leaflet + OpenStreetMap tiles (no API key), run inside a
// WebView on phones and an iframe on the web. The app sends the stops in
// with setStops(); a tapped pin is sent back as {type:'pick', key}.

export type MapStop = { key: string; n: number; lat: number; lng: number; name: string; done: boolean; issue: boolean }
export type MapData = { stops: MapStop[]; me: { lat: number; lng: number } | null }

export const MAP_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0;padding:0;background:#eef2ea}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  function post(msg) {
    var text = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else if (window.parent) window.parent.postMessage(text, '*');
  }
  var map = L.map('map', { zoomControl: true }).setView([26.9124, 75.7873], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var fitted = '';

  function pin(s) {
    var bg = s.done ? '#9CA3AF' : s.issue ? '#DC2626' : '#1B5E20';
    return L.divIcon({
      className: '',
      html: '<div style="width:30px;height:30px;border-radius:9999px;background:' + bg + ';color:#fff;font:700 13px/30px system-ui,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">' + (s.done ? '&#10003;' : String(s.n)) + '</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }

  window.setStops = function (data) {
    layer.clearLayers();
    var points = [];
    (data.stops || []).forEach(function (s) {
      // Customer names are user-typed: a text node, never HTML.
      var label = document.createElement('span');
      label.textContent = s.done ? s.name + ' (delivered)' : s.n + '. ' + s.name;
      L.marker([s.lat, s.lng], { icon: pin(s), zIndexOffset: s.done ? 0 : 1000 })
        .bindTooltip(label)
        .on('click', function () { post({ type: 'pick', key: s.key }); })
        .addTo(layer);
      points.push([s.lat, s.lng]);
    });
    if (data.me) {
      L.circleMarker([data.me.lat, data.me.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).addTo(layer);
      points.push([data.me.lat, data.me.lng]);
    }
    // Refit only when the stops change — a refresh mustn't undo the
    // partner's own zooming.
    var sig = (data.stops || []).map(function (s) { return s.key; }).join(',') + (data.me ? '|' + data.me.lat + ',' + data.me.lng : '');
    if (points.length && sig !== fitted) {
      fitted = sig;
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
    }
  };

  window.addEventListener('message', function (e) {
    try {
      var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (d && d.type === 'stops') window.setStops(d);
    } catch (_) {}
  });
  post({ type: 'ready' });
})();
</script>
</body>
</html>`
