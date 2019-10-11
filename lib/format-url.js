'use strict'

const path = require('path')

/**
 * Format URL.
 * @param object site
 * @param object file
 * @param string url
 * @return string url
 */
function formatURL (site, file, url) {
  if (!url) {
    return path.join(site.basepath, file.dir, file.name + '.html')
  }
  url += url.endsWith('.html') ? '' : '.html'
  return path.join(site.basepath, url)
}

module.exports = formatURL