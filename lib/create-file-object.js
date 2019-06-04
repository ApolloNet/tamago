'use strict'

const path = require('path')
const slugify = require('slugify')

/**
 * Create file object.
 * @param object site
 * @param string filepath
 * @return object file
 */
function createFileObject (site, filepath) {
  const file = {}
  file.path = filepath
  file.dir = path.dirname(file.path)
  file.ext = path.extname(file.path)
  file.name  = path.basename(file.path, file.ext)
  file.slug = slugify(file.name, site.slugifyOptions)
  return file
}

module.exports = createFileObject