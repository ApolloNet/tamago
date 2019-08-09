'use strict'

const path = require('path')

const fs = require('fs-extra')
const slugify = require('slugify')

const {buildIndex} = require('./build-indexes')

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
        slug: slug
      }
      site = buildIndex(site, index)
    })
  })
  return site
}

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
        const termObject = createTerm(site, taxonomy.name, term.name)
        site.taxonomies[taxoIndex].terms.push(termObject)
        termIndex = site.taxonomies[taxoIndex].terms.length - 1
        site.taxonomies[taxoIndex].terms[termIndex].posts = []
      }
      site.taxonomies[taxoIndex].terms[termIndex].posts.push(file.variables)
    })
  })
  return file
}

/**
 * Create taxonomy term object.
 * @param object site
 * @param string taxonomy
 * @param string term name
 * @return term object
 */
function createTerm(site, taxonomy, term) {
  const taxoSlug = slugify(taxonomy, site.slugifyOptions)
  const termSlug = slugify(term, site.slugifyOptions)
  return {
    name: term,
    path: path.join(taxoSlug, termSlug),
    url: path.join(site.basepath, taxoSlug, termSlug),
    slug: slugify(term, site.slugifyOptions)
  }
}

module.exports = {buildTaxonomies, buildSiteTaxonomies, createTerm}