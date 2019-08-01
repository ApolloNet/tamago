'use strict'

const path = require('path')

const fs = require('fs-extra')
const mustache = require('mustache')
const slugify = require('slugify')

/**
 * Build indexes HTML pages.
 * @param object site
 * @param array contents
 * @param string dir
 * @param string title
 * @param string slug
 * @return array indexes
 */
function buildIndex (site, contents, dir, title, slug) {
  fs.ensureDirSync(path.join(site.publicDir, dir))
  // Order contents by date.
  if (contents[0].date) {
    contents.sort(function (a, b) {
      return dir === 'posts'
        ? b.date.start.timestamp - a.date.start.timestamp
        : a.date.start.timestamp - b.date.start.timestamp
    })
  }
  // Paginate.
  const pagesNumber = Math.floor(contents.length / site.paginate) + 1
  Array(pagesNumber).fill(1).map((v, page) => {
    const begin = page * site.paginate
    const end = page * site.paginate + site.paginate
    // Article template.
    const articlesToDisplay = contents.slice(begin, end)
    const articlesHtml = articlesToDisplay.map(content => {
      const template = site.templates[`article--${content.contentType}--teaser`]
        ? site.templates[`article--${content.contentType}--teaser`]
        : site.templates['article--teaser']
      return mustache.render(template, content)
    }).join('\n')
    // Layout template.
    const layoutContent = {
      site: site,
      title: title,
      styles: site.styles,
      scripts: site.scripts,
      content: articlesHtml,
      classes: dir,
      pagination_exists: pagesNumber > 1,
      prevurl: page > 1 ? `index-${page - 1}.html` : `index.html`,
      nexturl: page < pagesNumber ? `index-${page + 1}.html` : null,
      prevurl_exists: page > 0,
      nexturl_exists: page < pagesNumber - 1
    }
    const html = mustache.render(site.templates['layout'], layoutContent)
    // Write file.
    const filename = page === 0 ? `/index.html` : `/index-${page}.html`
    fs.writeFile(path.join(site.publicDir, dir, filename), html)
      .then(() => console.log(`${filename} index created`))
      .catch(err => console.log(err))
    // Return index.
    const index = {
      title: title,
      body: articlesHtml,
      url: path.join(dir, filename),
      slug: slug ? slug : slugify(title, site.slugifyOptions)
    }
    site.indexes.push(index)
  })
  return site
}

module.exports = buildIndex