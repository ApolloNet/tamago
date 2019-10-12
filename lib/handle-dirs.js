'use strict'

const fs = require('fs-extra')
const recursive = require('recursive-readdir')
const createFileObject = require('./create-file-object')

/**
 * Handle Dirs.
 * @param object site
 * @param function callbak
 * @param array dirs
 * @param array exclude
 * @return object site
 */
async function handleDirs (site, callback, dirs, exclude) {
  exclude = exclude || site.exclude
  await Promise.all(dirs.map(async dir => {
    if (!fs.existsSync(dir)) {
      return
    }
    const files = await recursive(dir, exclude)
    files.map(filepath => {
      const file = createFileObject(site, filepath)
      site = callback(site, file)
    })
  }))
  return site
}

module.exports = handleDirs