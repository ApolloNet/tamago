'use strict'

const fs = require('fs-extra')
const recursive = require('recursive-readdir')
const createFileObject = require('./create-file-object')

/**
 * Handle Dirs.
 * @param object site
 * @param array dirs
 * @param function callbak
 * @return object site
 */
async function handleDirs (site, dirs, callback) {
  await Promise.all(dirs.map(async dir => {
    if (!fs.existsSync(dir)) {
      return
    }
    const files = await recursive(dir, site.exclude)
    files.map(filepath => {
      const file = createFileObject(site, filepath)
      site = callback(site, file)
    })
  }))
  return site
}

module.exports = handleDirs