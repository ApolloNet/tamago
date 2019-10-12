'use strict'

const request = require('request')

/**
 * Format geo from address string.
 * @param object site
 * @param object variables
 * @param string field
 * @return object variables
 */
function formatGeo (site, variables, field) {
  if (variables.lat && variables.lon) {
    variables.hasGeo = true
    variables.zoom = site.mapZoom
    variables.styles.push('/assets/libs/leaflet/leaflet.css')
    variables.scripts.push('/assets/libs/leaflet/leaflet.js')
    return variables
  }
  if (!variables[field]) {
    return variables
  }
  const options = {
    url: 'https://nominatim.openstreetmap.org/search'
      + '?format=json&addressdetails=0'
      + '&q=' + encodeURI(variables[field]),
    json: true,
    method: 'GET',
    headers: {
      'User-Agent': 'Tamago App',
      'Referer': 'http://localhost/'
    }
  }
  request(options, (err, res, body) => {
    if (err || res.statusCode !== 200) {
      console.warn(`formatGeo: error with ${url}`)
      return
    }
    variables.hasGeo = true
    variables.lat = body[0].lat
    variables.lon = body[0].lon
    variables.zoom = site.mapZoom
    variables.styles.push('/assets/libs/leaflet/leaflet.css')
    variables.scripts.push('/assets/libs/leaflet/leaflet.js')
  })
  return variables
}

module.exports = formatGeo