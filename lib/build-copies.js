'use strict'

const buildCopy = require('./build-copy')
const handleDirs = require('./handle-dirs')

/**
 * Build copies.
 * @param object site
 * @return object site
 */
async function buildCopies (site) {

  // TODO
  // recursive from the root path
  // exclude site.excludes, contentTypes, blocks, assets/scss, assets/js

  const assets = [
    'assets/favicons',
    'assets/fonts',
    'assets/img',
    'assets/libs'
  ]
  const dirs = [...assets, ...site.filesDirs]
  site = await handleDirs(site, dirs, buildCopy)
  return site
}

module.exports = buildCopies