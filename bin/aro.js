#!/usr/bin/env node
'use strict'

// Requires.
const process = require('process')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const request = require('request')
// Third parties.
const ncp = require('ncp')
const fr = require('date-fns/locale/fr')
const format = require('date-fns/format')
const marked = require('marked')
const matter = require('gray-matter')
const mkdirp = require('mkdirp')
const mustache = require('mustache')
const sharp = require('sharp')
const slugify = require('slugify')
// Promisify.
const Promise = require('bluebird')
Promise.promisifyAll(fs)
Promise.promisifyAll(request)
Promise.promisifyAll(mkdirp)

// Settings.
let site = {}

// Variables.
const slugifyOptions = {
  remove: /[*+~.()'"!:@]/g,
  lower: true
}

// Catch it if you can.
try {
  go()
} catch (error) {
  console.log(error)
}

/**
 * Go.
 */
function go () {
  defineSiteSettings()
  const args = process.argv.slice(2)
  if (args[0] === 'init' && args[1]) {
    init(args[1])
    return
  }
  if (args[0] === 'build') {
    build()
    return
  }
  help()
}

/**
 * Build.
 */
async function build () {
  // Clean public dir.
  clean()
  // Content.
  site.templates = await loadTemplates()
  site.pages = await buildContents(site.pagesDir)
  site.posts = await buildContents(site.postsDir)
  const taxoIndexes = await buildTaxonomies()
  const postsIndexes = await buildIndex(site.posts, '', 'Posts')
  const contents = [...site.pages, ...site.posts]
  const customUrls = [...postsIndexes, ...taxoIndexes]
  await buildSitemap(contents, customUrls)
  // Files.
  await buildFiles()
  // Assets.
  await buildLibs()
  await buildImages()
  await buildCSS()
  await buildJS()
}

/**
 * Build contents HTML pages.
 * @param string dir
 * @return array
 */
async function buildContents (dir) {
  // Make dir.
  await mkdirp.mkdirpAsync(path.join(site.publicDir, dir))
  // Files.
  const files = await fs.readdirAsync(dir)
  const contents = await Promise.all(files.map(async (filename) => {
    // Format file data.
    const file = await {
      basename: path.basename(filename, '.md'),
      dir: dir,
      path: path.join(dir, filename)
    }
    file.htmlpath = path.join(site.publicDir, dir, file.basename + '.html')
    file.content = await fs.readFileAsync(file.path, 'utf-8')
    file.variables = await fileFormatVariables(file)
    // Build site taxonomies.
    buildSiteTaxonomies(file)
    // Article template.
    const layoutContent = {
      site: site,
      styles: file.variables.styles,
      scripts: file.variables.scripts,
      content: mustache.render(site.templates['article--full'], file.variables)
    }
    // Layout template.
    const html = mustache.render(site.templates['layout'], layoutContent)
    // Write file.
    fs.writeFileAsync(file.htmlpath, html)
    // Return file variables object.
    return file.variables
  }))
  return contents
}

/**
 * Build indexes HTML pages.
 * @param array contents
 * @param string dirPath
 * @param string title
 * @return array indexes
 */
async function buildIndex (contents, dirPath, title) {
  // Make dir.
  await mkdirp.mkdirpAsync(path.join(site.publicDir, dirPath))
  // Order contents by date.
  contents.sort(function (a, b) {
    return b.date.timestamp - a.date.timestamp;
  });
  // Paginate.
  const pagesNumber = Math.floor(contents.length / site.paginate) + 1
  const indexes = await Promise.all(Array(pagesNumber).fill(1).map(async (v, page) => {
    const begin = page * site.paginate
    const end = page * site.paginate + site.paginate
    // Article template.
    const articlesToDisplay = contents.slice(begin, end)
    const articlesHtml = articlesToDisplay.map(content => {
      return mustache.render(site.templates['article--teaser'], content)
    }).join('\n')
    // Layout template.
    const layoutContent = {
      site: site,
      title: title,
      content: articlesHtml,
      pagination_exists: true,
      prevurl: page > 1 ? `index-${page - 1}.html` : `index.html`,
      nexturl: page < pagesNumber ? `index-${page + 1}.html` : null,
      prevurl_exists: page > 0,
      nexturl_exists: page < pagesNumber - 1
    }
    const html = mustache.render(site.templates['layout'], layoutContent)
    // Write file.
    const filename = page === 0 ? `/index.html` : `/index-${page}.html`
    fs.writeFileAsync(path.join(site.publicDir, dirPath, filename), html)
    // Return url.
    return path.join(dirPath, filename)
  }))
  return indexes
}

/**
 * Build taxonomies object.
 * @param object file
 * @return object file
 */
async function buildSiteTaxonomies (file) {
  if (!file.variables.taxonomies) {
    return
  }
  if (!site.hasOwnProperty('taxonomies')) {
    site.taxonomies = []
  }
  await Promise.all(Object.entries(file.variables.taxonomies).map(async (taxonomyArray) => {
    const taxonomy = taxonomyArray[1]
    let taxoIndex = site.taxonomies.findIndex(siteTaxo => {
      return siteTaxo.name === taxonomy.name
    })
    if (taxoIndex === -1) {
      site.taxonomies.push({
        name: taxonomy.name,
        terms: []
      })
      taxoIndex = site.taxonomies.length - 1
    }
    await Promise.all(Object.entries(taxonomy.terms).map(async (termArray) => {
      const term = termArray[1]
      let termIndex = site.taxonomies[taxoIndex].terms.findIndex(siteTerm => {
        return siteTerm.name === term.name
      })
      if (termIndex === -1) {
        const termObject = createTerm(taxonomy.name, term.name)
        site.taxonomies[taxoIndex].terms.push(termObject)
        termIndex = site.taxonomies[taxoIndex].terms.length - 1
        site.taxonomies[taxoIndex].terms[termIndex].posts = []
      }
      site.taxonomies[taxoIndex].terms[termIndex].posts.push(file.variables)
    }))
  }))
  return file
}

/**
 * Build taxonomies.
 * @return indexes
 */
async function buildTaxonomies () {
  const indexes = []
  if (!site.taxonomies) {
    return indexes
  }
  await Promise.all(site.taxonomies.map(async (taxonomy) => {
    await Promise.all(taxonomy.terms.map(async (term) => {
      const termIndexes = await buildIndex (term.posts, term.path, term.name)
      termIndexes.map(index => indexes.push(index))
    }))
  }))
  return indexes
}

/**
 * Get taxonomies from dir.
 * @param string dir
 * @return array taxonomies
 */
async function getTaxonomies (dir) {
  const files = await fs.readdirAsync(dir)
  const taxonomies = await Promise.all(files.map(async (filename) => {
    const taxonomy = {
      path: path.join(dir, filename),
      name: path.basename(filename, '.txt')
    }
    const content = await fs.readFileAsync(taxonomy.path, 'utf-8')
    const terms = content.split('\n')
    taxonomy.terms = terms.map(term => createTerm(taxonomy.name, term))
    return taxonomy
  }))
  return taxonomies
}

/**
 * Build sitemap.
 * @param array contents
 * @param array customUrls
 */
async function buildSitemap (contents, customUrls) {
  const contentsUrls = contents.map(content => {
    return content.url
  })
  const urls = [...contentsUrls, ...customUrls]
  const contentXml = urls.map(url => {
    const fullUrl = path.join(site.baseurl, site.basepath, url)
    return mustache.render(site.templates['article--sitemap'], {url: fullUrl})
  }).join('\n')
  const sitemapContent = {
    content: contentXml
  }
  const xml = mustache.render(site.templates['sitemap'], sitemapContent)
  fs.writeFileAsync(`${site.publicDir}/sitemap.xml`, xml)
}

/**
 * Format variables.
 * @param object file
 * @return array variables
 */
async function fileFormatVariables (file) {
  const frontmatter = await matter(file.content)
  const variables = frontmatter.data
  variables.body = await marked(frontmatter.content)
  variables.url = path.join(site.basepath, file.dir, file.basename + '.html')
  variables.styles = []
  variables.scripts = []
  formatDate(variables, 'date')
  await formatImage(variables, 'image')
  formatTaxonomies(variables)
  await formatGeo(variables, 'address')
  return variables
}

/**
 * Format date.
 * @param object variables
 * @param string field
 * @return object variables
 */
function formatDate (variables, field) {
  if (!variables[field]) {
    return
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
 * @param object variables
 * @param string image
 * @return object variables
 */
async function formatImage (variables, field) {
  if (!variables[field]) {
    variables.hasImage = false
    return
  }
  const imagePath = variables[field]
  const imageBasename = path.basename(imagePath)
  const imageExists = fs.statAsync(imagePath)
  if (!imageExists) {
    variables.hasImage = false
    return
  }
  variables.hasImage = true
  variables.imageDerivatives = {
    original: variables[field]
  }
  await Promise.all(site.imageFormats.map(async (format) => {
    const formatDir = path.join(site.publicDir, site.filesDir, format.name)
    const outputPath = path.join(formatDir, imageBasename)
    const outputSrc = path.join(site.basepath, site.filesDir, format.name, imageBasename)
    await mkdirp.mkdirpAsync(formatDir)
    sharp(imagePath).resize(format.width, format.height).toFile(outputPath)
    variables.imageDerivatives[format.name] = {
      src: outputSrc,
      width: format.width,
      height: format.height
    }
  }))
  return variables
}

/**
 * Format taxonomies.
 * @param object variables
 * @return object variables
 */
function formatTaxonomies (variables) {
  site.taxonomiesNames.map(taxonomyName => {
    if (!variables[taxonomyName]) {
      return
    }
    const terms = variables[taxonomyName].map(termName => {
      return createTerm(taxonomyName, termName)
    })
    variables.taxonomies = {
      [taxonomyName]: {
        name: taxonomyName,
        terms: terms,
        count: terms.length
      }
    }
  })
  return variables
}

/**
 * Format geo from address string.
 * @param object variables
 * @param string field
 * @return object variables
 */
async function formatGeo (variables, field) {
  if (!variables[field]) {
    return
  }
  const options = {
    url: 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&q=' + encodeURI(variables[field]),
    json: true,
    method: 'GET',
    headers: {
      'User-Agent': 'Aro App Test, alex@apollonet.fr',
      'Referer': 'http://localhost/'
    }
  }
  const res = await request.getAsync(options)
  if (res.statusCode !== 200) {
    return
  }
  variables.hasGeo = true
  variables.lat = res.body[0].lat
  variables.lon = res.body[0].lon
  variables.zoom = site.mapZoom
  variables.styles.push('/libs/leaflet/leaflet.css')
  variables.scripts.push('/libs/leaflet/leaflet.js')
  return variables
}

/**
 * Create taxonomy term object.
 * @param string taxonomy
 * @param string term name
 * @return term object
 */
function createTerm(taxonomy, term) {
  const taxoSlug = slugify(taxonomy, slugifyOptions)
  const termSlug = slugify(term, slugifyOptions)
  return {
    name: term,
    path: path.join(taxoSlug, termSlug),
    url: path.join(site.basepath, taxoSlug, termSlug)
  }
}

/**
 * Load templates.
 * @return object templates.
 */
async function loadTemplates () {
  const files = await fs.readdirAsync(site.templatesDir)
  const templates = {}
  await Promise.all(files.map(async (filename) => {
    const templateName = path.basename(filename, '.mustache')
    const templatePath = path.join(site.templatesDir, filename)
    const templateContent = await fs.readFileAsync(templatePath, 'utf-8')
    templates[templateName] = templateContent.toString()
  }))
  return templates
}

/**
 * Define site settings
 */
function defineSiteSettings () {
  const cwd = process.cwd()
  const settingsPath = path.join(cwd, '/settings.json')
  const overrides = fs.statAsync(settingsPath) ? require(settingsPath) : []
  const settings = {
    title: 'Le nom du titre',
    baseurl: 'http://aro.loc',
    basepath: '',
    cwd: cwd,
    publicDir: 'public',
    paginate: 10,
    templatesDir: 'templates',
    pagesDir: 'pages',
    postsDir: 'posts',
    filesDir: 'files',
    taxonomiesNames: ['tags'],
    dateFormat: 'D MMMM YYYY',
    mapZoom: 12,
    imageFormats: [
      {
        name: 'thumbnail',
        width: 300,
        height: 200
      },
      {
        name: 'large',
        width: 960,
        height: 480
      }
    ]
  }
  Object.keys(settings).map(setting => {
    settings[setting] = overrides[setting] ? overrides[setting] : settings[setting]
  })
  console.log(`Settings:`)
  console.log(settings)
  site = settings
}

/**
 * Log site datas.
 */
async function logSite() {
  const log = JSON.stringify(site)
  fs.writeFileAsync('logs/log.log', log)
}

/**
 * Exec and log.
 * @param string cmd
 */
async function execAndLog (cmd) {
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
  });
}

/**
 * Clean public dir.
 */
async function clean () {
  execAndLog(`rm -rf ${site.publicDir}/*`)
}

/**
 * Build files.
 */
async function buildFiles () {
  execAndLog(`cp -r files ${site.publicDir}/`)
}

/**
 * Build libs.
 */
async function buildLibs () {
  execAndLog(`cp -r assets/libs ${site.publicDir}/`)
}

/**
 * Build images.
 */
async function buildImages () {
  execAndLog(`cp -r assets/img ${site.publicDir}/`)
  //execAndLog(`imagemin assets/img ${site.publicDir}/img -p`)
}

/**
 * Build CSS.
 */
async function buildCSS () {
  await mkdirp.mkdirpAsync(`${site.publicDir}/css`)
  await execAndLog(`node-sass --output-style compressed -o ${site.cwd}/${site.publicDir}/css ${site.cwd}/assets/scss`)
  await execAndLog(`postcss -u autoprefixer -r ${site.cwd}/${site.publicDir}/css/app.css`)
}

/**
 * Build JS.
 */
async function buildJS () {
  await mkdirp.mkdirpAsync(`${site.publicDir}/js`)
  execAndLog(`babel assets/js --out-file ${site.publicDir}/js/app.js`)
}

/**
 * Init.
 * @param string name
 */
async function init (name) {
  const nameSlug = slugify(name, slugifyOptions)
  const defaultsDir = `${__dirname}/defaults`
  const newSettings = JSON.stringify({
    title: name,
    baseurl: '',
    basepath: '',
    taxonomiesNames: ['tags']
  })
  // Create dirs.
  await mkdirp.mkdirpAsync(nameSlug)
  await mkdirp.mkdirpAsync(path.join(nameSlug, site.publicDir))
  // Copy defaults.
  ncp(defaultsDir, nameSlug, () => {})
  // Create settings file.
  fs.writeFile(path.join(nameSlug, 'settings.json'), newSettings, 'utf8', () => {})
  // Log.
  console.log(`Project "${name}" is created in the directory "${nameSlug}"`)
  console.log(`Adjust the config in its settings.json file`)
  console.log(`Next steps:`)
  console.log(`$ cd ${nameSlug}`)
  console.log(`$ aro build`)
}

/**
 * Help.
 */
function help () {
  console.log('⚠️ Commands are:')
  console.log('🚀 aro init "My website": init directory')
  console.log('🔧 aro build: build your website')
}