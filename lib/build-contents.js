'use strict'

const buildContent = require('./build-content')
const handleDirs = require('./handle-dirs')

/**
 * Build contents.
 * @param object site
 * @return object site
 */
async function buildContents (site) {
  const dirs = site.contentTypes
  site = await handleDirs(site, buildContent, dirs)
  return site
}

module.exports = buildContents