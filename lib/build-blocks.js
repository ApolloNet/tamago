'use strict'

const buildBlock = require('./build-block')
const handleDirs = require('./handle-dirs')

/**
 * Build blocks.
 * @param object site
 * @return object site
 */
async function buildBlocks (site) {
  const dirs = ['blocks']
  site = await handleDirs(site, dirs, buildBlock)
  return site
}

module.exports = buildBlocks