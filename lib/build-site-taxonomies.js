'use strict'

const slugify = require('slugify')
const formatTerm = require('./format-term')

/**
 * Build taxonomies object.
 * @param object site
 * @param object file
 * @return object file
 */
function buildSiteTaxonomies (site, file) {
  if (!file.variables.taxonomies) {
    return file
  }
  if (!site.hasOwnProperty('taxonomies')) {
    site.taxonomies = []
  }
  // Each taxonomy.
  Object.keys(file.variables.taxonomies).map(key => {
    const taxonomy = file.variables.taxonomies[key]
    let taxoIndex = site.taxonomies.findIndex(siteTaxo => {
      return siteTaxo.name === taxonomy.name
    })
    if (taxoIndex === -1) {
      site.taxonomies.push({
        name: taxonomy.name,
        slug: slugify(taxonomy.name, site.slugifyOptions),
        terms: []
      })
      taxoIndex = site.taxonomies.length - 1
    }
    // Each term.
    Object.keys(taxonomy.terms).map(key => {
      const term = taxonomy.terms[key]
      let termIndex = site.taxonomies[taxoIndex].terms.findIndex(siteTerm => {
        return siteTerm.name === term.name
      })
      if (termIndex === -1) {
        const termObject = formatTerm(site, taxonomy.name, term.name)
        site.taxonomies[taxoIndex].terms.push(termObject)
        termIndex = site.taxonomies[taxoIndex].terms.length - 1
        site.taxonomies[taxoIndex].terms[termIndex].posts = []
      }
      site.taxonomies[taxoIndex].terms[termIndex].posts.push(file.variables)
    })
  })
  return file
}

module.exports = buildSiteTaxonomies