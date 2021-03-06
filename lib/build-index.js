'use strict'

const path = require('path')
const fs = require('fs-extra')
const handlebars = require('handlebars')
const slugify = require('slugify')
const formatBlocks = require('./format-blocks')

/**
 * Build indexes HTML pages.
 * @param object site
 * @param object index
 * @return object site
 */
function buildIndex (site, index) {
  const contents = index.contents
    ? index.contents
    : site[index.dir]
  if (!contents) {
    return site
  }
  // Order contents by date.
  if (contents[0].date) {
    contents.sort(function (a, b) {
      return index.dir === 'posts'
        ? b.date.start.timestamp - a.date.start.timestamp
        : a.date.start.timestamp - b.date.start.timestamp
    })
  }
  // Slug.
  index.slug = index.slug
    ? index.slug
    : slugify(index.title, site.slugifyOptions)
  // Blocks.
  index.blocks = formatBlocks(site, index.blocks)
  // Paginate.
  let paginate = site.paginate
  site.indexes.forEach(configIndex => {
    if (configIndex.paginate && configIndex.dir === index.dir) {
      paginate = configIndex.paginate
    }
  })
  fs.ensureDirSync(path.join(site.publicDir, index.dir))
  const pagesNumber = Math.floor(contents.length / paginate) + 1
  Array(pagesNumber).fill(1).map((v, page) => {
    const filename = page === 0 ? `/index.html` : `/index-${page}.html`
    const filepath = path.join(site.publicDir, index.dir, filename)
    index.url = path.join(site.basepath, index.dir, filename)
    // Article template.
    const begin = page * paginate
    const end = page * paginate + paginate
    const articlesToDisplay = contents.slice(begin, end)
    index.body = articlesToDisplay.map(content => {
      const contentTplString = site.templates[`article--${content.contentType}--teaser`]
        ? site.templates[`article--${content.contentType}--teaser`]
        : site.templates['article--teaser']
      const contentTpl = handlebars.compile(contentTplString)
      return contentTpl(content)
    }).join('\n')
    // Layout template.
    const layoutContent = {
      site: site,
      title: index.title,
      page: index,
      styles: site.styles,
      scripts: site.scripts,
      content: index.body,
      classes: index.dir,
      pagination_exists: pagesNumber > 1,
      prevurl: page > 1 ? `index-${page - 1}.html` : `index.html`,
      nexturl: page < pagesNumber ? `index-${page + 1}.html` : null,
      prevurl_exists: page > 0,
      nexturl_exists: page < pagesNumber - 1
    }
    const layoutTpl = handlebars.compile(site.templates['layout'])
    const html = layoutTpl(layoutContent)
    // Write file.
    fs.writeFile(filepath, html)
      .catch(err => console.error(err))
    // Update site object.
    site.indexes.push(index)
  })
  return site
}

module.exports = buildIndex