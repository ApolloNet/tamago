'use strict'

const buildCopy = require('./build-copy')
const handleDirs = require('./handle-dirs')

/**
 * Build copies.
 * @param object site
 * @return object site
 */
async function buildCopies (site) {
  const dirs = ['.']
  const exclude = [
    ...site.exclude,
    ...site.contentTypes,
    'blocks',
    'assets/scss',
    'assets/js'
  ]
  site = await handleDirs(site, buildCopy, dirs, exclude)
  return site
}

module.exports = buildCopies