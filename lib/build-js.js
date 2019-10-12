'use strict'

const path = require('path')
const buildCopy = require('./build-copy')
const handleDirs = require('./handle-dirs')

/**
 * Build JS files.
 * @param object site
 * @return object site
 */
async function buildJS (site) {
  const dirs = ['assets/js']
  site = await handleDirs(site, buildJSFile, dirs)
  return site
}

/**
 * Build JS file.
 * @param object site
 * @param object file
 * @return object site
 */
function buildJSFile (site, file) {
  buildCopy(site, file)
  site.scripts.push(path.join(site.basepath, file.dir, file.name + file.ext))
  return site
}

module.exports = buildJS