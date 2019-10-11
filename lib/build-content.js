'use strict'

const path = require('path')
const fs = require('fs-extra')
const handlebars = require('handlebars')
const buildSiteTaxonomies = require('./build-site-taxonomies')
const formatContent = require('./format-content')
const formatBlocks = require('./format-blocks')

/**
 * Build contents.
 * @param object site
 * @param object file
 * @return object site
 */
function buildContent (site, file) {
  fs.ensureDirSync(path.join(site.publicDir, file.dir))
  // File data.
  file.variables = formatContent(site, file)
  // 404.
  if (file.name === '404') {
    file.variables.url = path.join(site.basepath, '404.html')
  }
  // Blocks.
  file.blocks = formatBlocks(site, file.variables.blocks)
  // Build site taxonomies.
  buildSiteTaxonomies(site, file)
  // Templates.
  const contentTplString = site.templates[`article--${file.contentType}--full`]
    ? site.templates[`article--${file.contentType}--full`]
    : site.templates['article--full']
  const contentTpl = handlebars.compile(contentTplString)
  const layoutTpl = handlebars.compile(site.templates['layout'])
  // Write HTML.
  const layoutContent = {
    site: site,
    styles: [...site.styles, ...file.variables.styles],
    scripts: [...site.scripts, ...file.variables.scripts],
    page: file,
    title: file.variables.title,
    description: file.variables.description,
    classes: `page-${file.contentType} ${file.slug}`,
    content: contentTpl(file.variables)
  }
  const html = layoutTpl(layoutContent)
  const dest = file.variables.url
    ? path.join(site.publicDir, file.variables.url)
    : path.join(site.publicDir, file.dir, file.name + '.html')
  fs.writeFile(dest, html)
    .catch(err => console.error(err))
  // Load file variables in the site object.
  site[file.dir].push(file.variables)
  return site
}

module.exports = buildContent