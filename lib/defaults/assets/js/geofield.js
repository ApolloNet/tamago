const geofield = (function geofieldConstructor() {
  // Init.
  function init() {
    const map = document.querySelector('#map')
    const lat = map.getAttribute('data-lat')
    const lon = map.getAttribute('data-lon')
    const zoom = map.getAttribute('data-zoom')
    const geofieldMap = L.map('map').setView([lat, lon], zoom)
    const mapLayer = 'https://{s}.tile.osm.org/{z}/{x}/{y}.png'
    const mapLayerOptions = {
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
    }
    L.tileLayer(mapLayer, mapLayerOptions).addTo(geofieldMap)
    // Finger trap.
    geofieldMap.scrollWheelZoom.disable()
    // Marker
    L.marker([lat, lon]).addTo(geofieldMap)
  }
  // Return.
  return {
    init: init
  }
})()
