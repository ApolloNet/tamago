'use strict'

const fs = require('fs-extra')
const buildIndex = require('./build-index')

/**
 * Build taxonomies.
 * @param object site
 * @return object site
 */
function buildTaxonomies (site) {
  if (!site.taxonomies) {
    return site
  }
  site.taxonomies.map(taxonomy => {
    taxonomy.terms.map(term => {
      const slug = taxonomy.slug + '-' + term.slug
      const index = {
        dir: term.path,
        title: term.name,
        slug: slug,
        contents: term.contents
      }
      site.indexes.push(index)
    })
  })
  return site
}

module.exports = buildTaxonomies