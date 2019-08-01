'use strict'

const path = require('path')
const fs = require('fs-extra')

/**
 * Copy a file to the public directory.
 * @param object site
 * @param object file
 */
function buildCopy (site, file) {
  file.pathSegments = file.path.split(path.sep)
  const destDir = file.dir === 'assets/favicons'
    ? site.publicDir
    : path.join(site.publicDir, file.dir)
  const dest = path.join(destDir, file.name + file.ext)
  fs.ensureDirSync(destDir)
  fs.copy(file.path, dest)
    .then(() => console.log(`${file.path} copied`))
    .catch(err => console.error(err))
  return site
}

module.exports = buildCopy