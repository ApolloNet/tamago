'use strict'

const path = require('path')
const request = require('request')
const util = require('util')

const fs = require('fs-extra')
const format = require('date-fns/format')
const getHours = require('date-fns/get_hours')
const getMinutes = require('date-fns/get_minutes')
const fr = require('date-fns/locale/fr')
const marked = require('marked')
const matter = require('gray-matter')
const sharp = require('sharp')
const slugify = require('slugify')

const {createTerm} = require('./build-taxonomies')

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

/**
 * Format URL.
 * @param object site
 * @param object file
 * @param string url
 * @return string url
 */
function formatURL (site, file, url) {
  if (!url) {
    return path.join(site.basepath, file.dir, file.name + '.html')
  }
  url += url.endsWith('.html') ? '' : '.html'
  return path.join(site.basepath, url)
}

/**
 * Format date.
 * @param object site
 * @param object variables
 * @param string field
 * @return object variables
 */
function formatDates (site, variables, field) {
  if (!variables[field]) {
    return variables
  }
  // Turn string into array.
  const dates = Array.isArray(variables[field])
    ? variables[field]
    : Array(variables[field])
  // Format.
  const datesObjects = dates.map(date => {
    const dateSplit = date.split(' - ')
    return formatDateObject(site, dateSplit[0], dateSplit[1])
  })
  // Re-turn to string if input was a string.
  variables[field] = Array.isArray(variables[field])
    ? datesObjects
    : datesObjects[0]
  // Add a 'date' field for sorting.
  if (field === 'dates' && !variables['date']) {
    variables['date'] = variables['dates'][0]
  }
  return variables
}

/**
 * Format date object
 * @param object site
 * @param string dateStartString
 * @param string dateEndString
 * @return object date
 */
function formatDateObject (site, dateStartString, dateEndString) {
  const output = {
    start: null,
    end: null,
    render: null
  }
  const dateStart = new Date(dateStartString)
  const dateEnd = dateEndString ? new Date(dateEndString) : null
  // Date start.
  output.start = {
    // If time is 00:00, content is considered "all day long".
    allDay: (getHours(dateStart) == 0 && getMinutes(dateStart) == 0),
    timestamp: format(dateStart, 'X')
  }
  site.dateFormats.map(dateFormat => {
    output.start[dateFormat.name] = format(
      dateStart,
      dateFormat.format,
      {locale: fr}
    )
  })
  output.render = output.start.allDay
    ? output.start.short
    : output.start.long
  // Date end.
  if (dateEnd) {
    output.end = {
      timestamp: format(dateEnd, 'X')
    }
    site.dateFormats.map(dateFormat => {
      output.end[dateFormat.name] = format(
        dateEnd,
        dateFormat.format,
        {locale: fr}
      )
    })
    output.render = util.format(
      site.dateMultipleFormat,
      output.start.short,
      output.end.short
    )
  }
  // Return.
  return output
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
  const imagePath = path.isAbsolute(variables[field])
    ? '.' + variables[field]
    : variables[field]
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
  if (variables.lat && variables.lon) {
    variables.hasGeo = true
    variables.zoom = site.mapZoom
    variables.styles.push('/assets/libs/leaflet/leaflet.css')
    variables.scripts.push('/assets/libs/leaflet/leaflet.js')
    return variables
  }
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
    variables.styles.push('/assets/libs/leaflet/leaflet.css')
    variables.scripts.push('/assets/libs/leaflet/leaflet.js')
  })
  return variables
}

module.exports = formatContent