'use strict'

const path = require('path')

const fs = require('fs-extra')
const mustache = require('mustache')

/**
 * Build sitemap.
 * @param object site
 * @return bool sitemap file exists
 */
function buildSitemap (site) {
  fs.ensureDirSync(site.publicDir)
  let contents = [...site.indexes]
  site.contentTypes.map(type => {
    contents = [...contents, ...site[type]]
  })
  const contentsXml = contents.map(content => {
    const fullUrl = path.join(site.baseurl, site.basepath, content.url)
    return mustache.render(site.templates['article--sitemap'], {url: fullUrl})
  }).join('\n')
  const xml = mustache.render(site.templates['sitemap'], {content: contentsXml})
  const sitemapFile = path.join(site.publicDir, 'sitemap.xml')
  fs.writeFileSync(sitemapFile, xml)
  return fs.accessSync(sitemapFile) === undefined ? true : false
}

module.exports = buildSitemap