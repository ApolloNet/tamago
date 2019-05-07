'use strict'

const path = require('path')
const buildCopy = require('./build-copy')

/**
 * Build JS.
 * @param object site
 * @param object file
 */
function buildJS (site, file) {
  buildCopy(site, file)
  site.scripts.push(path.join(site.basepath, file.dir, file.name + file.ext))
  return site
}

module.exports = buildJS