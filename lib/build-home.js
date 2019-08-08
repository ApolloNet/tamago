'use strict'

const path = require('path')

const fs = require('fs-extra')
const handlebars = require('handlebars')

/**
 * Build homepage.
 * @param object site
 */
function buildHome (site) {
  const home = getContent(site, site.home.where, site.home.slug)
  const output = path.join(site.publicDir, 'index.html')
  const homeContent = {
    site: site,
    title: home.title,
    description: home.description,
    styles: site.styles,
    scripts: site.scripts,
    page: home,
    classes: 'home',
    content: home.body
  }
  const layoutTpl = handlebars.compile(site.templates['layout'])
  const html = layoutTpl(homeContent)
  fs.writeFile(output, html)
    .catch(err => console.error(err))
  return site
}

/**
 * Get content.
 * @param object site
 * @param string dir
 * @param string slug
 * @return object content
 */
function getContent (site, dir, slug) {
  let output = null
  site[dir].map(content => {
    if (content.slug === slug) {
      output = content
    }
  })
  return output
}

module.exports = buildHome