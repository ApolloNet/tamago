'use strict'

const fs = require('fs-extra')
const marked = require('marked')
const matter = require('gray-matter')
const slugify = require('slugify')
const formatDates = require('./format-dates')
const formatGeo = require('./format-geo')
const formatImage = require('./format-image')
const formatTaxonomies = require('./format-taxonomies')
const formatURL = require('./format-url')

/**
 * Format variables.
 * @param object site
 * @param object file
 * @return array variables
 */
function formatContent (site, file) {
  file.content = fs.readFileSync(file.path)
  const frontmatter = matter(file.content)
  const variables = {}
  for (let prop in frontmatter.data) {
    variables[prop] = frontmatter.data[prop]
  }
  variables.contentType = file.contentType
  variables.body = marked(frontmatter.content)
  variables.url = formatURL(site, file, variables.url)
  variables.slug = slugify(file.name, site.slugifyOptions)
  variables.styles = variables.styles || []
  variables.scripts = variables.scripts || []
  site.dateFields.map(field => formatDates(site, variables, field))
  site.imageFields.map(field => formatImage(site, variables, field))
  formatTaxonomies(site, variables)
  site.geoFields.map(field => formatGeo(site, variables, field))
  return variables
}

module.exports = formatContent