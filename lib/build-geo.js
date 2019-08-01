'use strict'

const path = require('path')
const fs = require('fs-extra')

/**
 * Build geo json.
 * @param object site
 */
function buildGeo (site) {
  fs.ensureDirSync(site.publicDir)
  let contents = []
  site.contentTypes.map(type => {
    contents = [...contents, ...site[type]]
  })
  const geoContents = contents.filter(content => content.hasGeo)
  if (!geoContents.length) {
    return site
  }
  const json = JSON.stringify(geoContents)
  fs.writeFile(path.join(site.publicDir, 'geo.json'), json)
  return site
}

module.exports = buildGeo