'use strict'

const path = require('path')
const request = require('request')

const format = require('date-fns/format')
const fr = require('date-fns/locale/fr')
const fs = require('fs-extra')
const marked = require('marked')
const matter = require('gray-matter')
const mustache = require('mustache')
const sharp = require('sharp')
const slugify = require('slugify')

const {buildSiteTaxonomies, createTerm} = require('./build-taxonomies')

/**
 * Build contents.
 * @param object site
 * @param object file
 */
function buildContent (site, file) {
  fs.ensureDirSync(path.join(site.publicDir, file.dir))
  // File data.
  file.htmlpath = path.join(site.publicDir, file.dir, file.name + '.html')
  file.content = fs.readFileSync(file.path)
  file.variables = fileFormatVariables(site, file)
  // Build site taxonomies.
  buildSiteTaxonomies(site, file)
  // Write HTML.
  const template = site.templates[`article--${file.contentType}--full`]
    ? site.templates[`article--${file.contentType}--full`]
    : site.templates['article--full']
  const layoutContent = {
    site: site,
    styles: [...site.styles, ...file.variables.styles],
    scripts: [...site.scripts, ...file.variables.scripts],
    content: mustache.render(template, file.variables)
  }
  const html = mustache.render(site.templates['layout'], layoutContent)
  fs.writeFile(file.htmlpath, html)
    .then(() => {
      console.log(`${file.path} built`)
      if (file.name === '404') {
        build404(site, file)
      }
    })
    .catch(err => console.error(err))
  // Load file variables in the site object.
  site[file.dir].push(file.variables)
  return site
}

/**
 * Build 404 page
 * @param object site
 * @param object file
 */
function build404 (site, file) {
  fs.copy(file.htmlpath, path.join(site.publicDir, '404.html'))
    .then(() => console.log('404.html created'))
    .catch(err => console.error(err))
}

/**
 * Format variables.
 * @param object site
 * @param object file
 * @return array variables
 */
function fileFormatVariables (site, file) {
  const frontmatter = matter(file.content)
  const variables = frontmatter.data
  variables.contentType = file.contentType
  variables.body = marked(frontmatter.content)
  variables.url = path.join(site.basepath, file.dir, file.name + '.html')
  variables.slug = slugify(file.name, site.slugifyOptions)
  variables.styles = []
  variables.scripts = []
  formatDate(site, variables, 'date')
  formatImage(site, variables, 'image')
  formatTaxonomies(site, variables)
  formatGeo(site, variables, 'address')
  return variables
}

/**
 * Format date.
 * @param object site
 * @param object variables
 * @param string field
 * @return object variables
 */
function formatDate (site, variables, field) {
  if (!variables[field]) {
    return variables
  }
  const dateObject = new Date(variables[field])
  variables[field] = {
    object: dateObject,
    render: format(dateObject, site.dateFormat, {locale: fr}),
    timestamp: format(dateObject, 'X')
  }
  return variables
}

/**
 * Format image.
 * @param object site
 * @param object variables
 * @param string image
 * @return object variables
 */
function formatImage (site, variables, field) {
  if (!variables[field]) {
    variables.hasImage = false
    return variables
  }
  const imagePath = variables[field]
  const imageBasename = path.basename(imagePath)
  const imageExists = fs.existsSync(imagePath)
  if (!imageExists) {
    variables.hasImage = false
    return variables
  }
  variables.hasImage = true
  variables.imageDerivatives = {
    original: variables[field]
  }
  site.imageFormats.map(format => {
    site.filesDirs.map(dir => {
      const formatDir = path.join(site.publicDir, dir, format.name)
      const outputPath = path.join(formatDir, imageBasename)
      const outputSrc = path.join(site.basepath, dir, format.name, imageBasename)
      fs.ensureDirSync(formatDir)
      sharp(imagePath).resize(format.width, format.height).toFile(outputPath)
      variables.imageDerivatives[format.name] = {
        src: outputSrc,
        width: format.width,
        height: format.height
      }
    })
  })
  return variables
}

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
      return createTerm(site, taxonomyName, termName)
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

/**
 * Format geo from address string.
 * @param object site
 * @param object variables
 * @param string field
 * @return object variables
 */
function formatGeo (site, variables, field) {
  if (!variables[field]) {
    return variables
  }
  const options = {
    url: 'https://nominatim.openstreetmap.org/search'
      + '?format=json&addressdetails=0'
      + '&q=' + encodeURI(variables[field]),
    json: true,
    method: 'GET',
    headers: {
      'User-Agent': 'Tamago App',
      'Referer': 'http://localhost/'
    }
  }
  request(options, (err, res, body) => {
    if (err || res.statusCode !== 200) {
      console.warn(`formatGeo: error with ${url}`)
      return
    }
    variables.hasGeo = true
    variables.lat = body[0].lat
    variables.lon = body[0].lon
    variables.zoom = site.mapZoom
    variables.styles.push('/libs/leaflet/leaflet.css')
    variables.scripts.push('/libs/leaflet/leaflet.js')
  })
  return variables
}

module.exports = buildContent