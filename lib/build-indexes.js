'use strict'

const buildIndex = require('./build-index')

/**
 * Build indexes.
 * @param object site
 * @return object site
 */
function buildIndexes (site) {
  site.indexes.map(index => {
    site = buildIndex(site, index)
  })
  return site
}

module.exports = buildIndexes