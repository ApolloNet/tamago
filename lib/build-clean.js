'use strict'

const fs = require('fs-extra')

/**
 * Build clean.
 * @param object site
 * @return object site
 */
function buildClean(site) {
  fs.removeSync(site.publicDir)
  return site
}

module.exports = buildClean