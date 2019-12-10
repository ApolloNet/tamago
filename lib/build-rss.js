'use strict'

const path = require('path')
const fs = require('fs-extra')
const format = require('date-fns/format')

/**
 * Build RSS.
 * @param object site
 * @return object site
 */
function buildRSS (site) {
  if (!site.rss) {
    return site
  }
  const rssFile = path.join(site.publicDir, 'rss.xml')
  let contents = []
  site.rss.contents.map(type => {
    contents = [...contents, ...site[type]]
  })
  let xml = `<?xml version="1.0" encoding="utf-8" ?>
    <rss version="2.0"
      xml:base="${site.baseurl}/rss.xml"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
    <title>${site.title}</title>
    <link>${site.baseurl}/rss.xml</link>
    <description>${site.rss.description}</description>
    <atom:link href="${site.baseurl}/rss.xml"
      rel="self" type="application/rss+xml" />`
  contents.map(content => {
    const fullUrl = site.baseurl + content.url
    const dateRSS = format(content.date.start.object, 'EEE, dd LLL yyyy HH:mm:ss x')
    xml += `<item>
      <title>${content.title}</title>
      <link>${fullUrl}</link>
      <guid>${fullUrl}</guid>
      <description><![CDATA[${content.body}]]></description>
      <pubDate>${dateRSS}</pubDate>
      </item>`
  })
  xml += `</channel>
    </rss>`
  fs.writeFileSync(rssFile, xml)
  return site
}

module.exports = buildRSS