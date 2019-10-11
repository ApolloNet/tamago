'use strict'

const path = require('path')
const slugify = require('slugify')

/**
 * Format taxonomy term object.
 * @param object site
 * @param string taxonomy
 * @param string term name
 * @return term object
 */
function formatTerm(site, taxonomy, term) {
  const taxoSlug = slugify(taxonomy, site.slugifyOptions)
  const termSlug = slugify(term, site.slugifyOptions)
  return {
    name: term,
    path: path.join(taxoSlug, termSlug),
    url: path.join(site.basepath, taxoSlug, termSlug),
    slug: slugify(term, site.slugifyOptions)
  }
}

module.exports = formatTerm