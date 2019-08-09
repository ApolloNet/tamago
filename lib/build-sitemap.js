'use strict'

const path = require('path')

const fs = require('fs-extra')
const handlebars = require('handlebars')

/**
 * Build sitemap.
 * @param object site
 * @return bool sitemap file exists
 */
function buildSitemap (site) {
  fs.ensureDirSync(site.publicDir)
  const contentTpl = handlebars.compile(site.templates['article--sitemap'])
  const sitemapTpl = handlebars.compile(site.templates['sitemap'])
  const sitemapFile = path.join(site.publicDir, 'sitemap.xml')
  let contents = [...site.indexes]
  site.contentTypes.map(type => {
    contents = [...contents, ...site[type]]
  })
  const contentsXml = contents.map(content => {
    const fullUrl = site.baseurl + content.url
    return contentTpl({url: fullUrl})
  }).join('\n')
  const xml = sitemapTpl({content: contentsXml})
  fs.writeFileSync(sitemapFile, xml)
  return fs.accessSync(sitemapFile) === undefined ? true : false
}

module.exports = buildSitemap