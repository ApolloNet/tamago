'use strict'

const slugify = require('slugify')
const formatTerm = require('./format-term')

/**
 * Format taxonomies.
 * @param object site
 * @param object variables
 * @return object variables
 */
function formatTaxonomies (site, variables) {
  site.taxonomiesNames.map(taxonomyName => {
    if (!variables[taxonomyName]) {
      return
    }
    const terms = variables[taxonomyName].map(termName => {
      return formatTerm(site, taxonomyName, termName)
    })
    variables.taxonomies = {
      [taxonomyName]: {
        name: taxonomyName,
        slug: slugify(taxonomyName, site.slugifyOptions),
        terms: terms,
        count: terms.length
      }
    }
  })
  return variables
}

module.exports = formatTaxonomies