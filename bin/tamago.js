#!/usr/bin/env node
'use strict'

// Requires.
const process = require('process')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const request = require('request')
// Third parties.
const autoprefixer = require('autoprefixer')
const ncp = require('ncp')
const fr = require('date-fns/locale/fr')
const format = require('date-fns/format')
const marked = require('marked')
const matter = require('gray-matter')
const mkdirp = require('mkdirp')
const mustache = require('mustache')
const sass = require('node-sass')
const postcss = require('postcss')
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

// Let's
go()

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
  await clean()
  // Files.
  await buildFiles()
  // Assets.
  await buildLibs()
  await buildImages()
  await buildCSS()
  await buildJS()
  // Content.
  await loadTemplates()
  await buildContents(site.pagesDir)
  await buildContents(site.postsDir)
  await buildTaxonomies()
  await buildIndex(site.posts, 'posts', 'Posts')
  await buildHome()
  await buildSitemap()
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
      styles: [...site.styles, file.variables.styles],
      scripts: [...site.scripts, ...file.variables.scripts],
      content: mustache.render(site.templates['article--full'], file.variables)
    }
    // Layout template.
    const html = mustache.render(site.templates['layout'], layoutContent)
    // Write file.
    fs.writeFileAsync(file.htmlpath, html)
    // 404
    if (file.basename === '404') {
      ncp(file.htmlpath, path.join(site.publicDir, '404.html'), () => {})
    }
    // Return file variables object.
    return file.variables
  }))
  site[dir] = contents
}

/**
 * Build indexes HTML pages.
 * @param array contents
 * @param string dirPath
 * @param string title
 * @param string slug
 * @return array indexes
 */
async function buildIndex (contents, dirPath, title, slug) {
  // Make dir.
  await mkdirp.mkdirpAsync(path.join(site.publicDir, dirPath))
  // Order contents by date.
  contents.sort(function (a, b) {
    return b.date.timestamp - a.date.timestamp
  })
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
      styles: site.styles,
      scripts: site.scripts,
      content: articlesHtml,
      pagination_exists: pagesNumber > 1,
      prevurl: page > 1 ? `index-${page - 1}.html` : `index.html`,
      nexturl: page < pagesNumber ? `index-${page + 1}.html` : null,
      prevurl_exists: page > 0,
      nexturl_exists: page < pagesNumber - 1
    }
    const html = mustache.render(site.templates['layout'], layoutContent)
    // Write file.
    const filename = page === 0 ? `/index.html` : `/index-${page}.html`
    fs.writeFileAsync(path.join(site.publicDir, dirPath, filename), html)
    // Return index.
    const index = {
      title: title,
      body: articlesHtml,
      url: path.join(dirPath, filename),
      slug: slug ? slug : slugify(title, slugifyOptions)
    }
    site.indexes.push(index)
  }))
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
  // Each taxonomy.
  await Promise.all(Object.entries(file.variables.taxonomies).map(async (taxonomyArray) => {
    const taxonomy = taxonomyArray[1]
    let taxoIndex = site.taxonomies.findIndex(siteTaxo => {
      return siteTaxo.name === taxonomy.name
    })
    if (taxoIndex === -1) {
      site.taxonomies.push({
        name: taxonomy.name,
        slug: slugify(taxonomy.name, slugifyOptions),
        terms: []
      })
      taxoIndex = site.taxonomies.length - 1
    }
    // Each term.
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
  if (!site.taxonomies) {
    return
  }
  await Promise.all(site.taxonomies.map(async (taxonomy) => {
    await Promise.all(taxonomy.terms.map(async (term) => {
      const slug = taxonomy.slug + '-' + term.slug
      await buildIndex (term.posts, term.path, term.name, slug)
    }))
  }))
}

/**
 * Build homepage.
 */
async function buildHome () {
  const home = await getContent(site.home.where, site.home.slug)
  const homeContent = {
    site: site,
    title: home.title,
    styles: site.styles,
    scripts: site.scripts,
    content: home.body
  }
  const html = mustache.render(site.templates['layout'], homeContent)
  fs.writeFileAsync(path.join(site.publicDir, 'index.html'), html)
}

/**
 * Build sitemap.
 */
async function buildSitemap () {
  const contents = [...site.pages, ...site.posts, ...site.indexes]
  const contentsXml = contents.map(content => {
    const fullUrl = path.join(site.baseurl, site.basepath, content.url)
    return mustache.render(site.templates['article--sitemap'], {url: fullUrl})
  }).join('\n')
  const xml = mustache.render(site.templates['sitemap'], {content: contentsXml})
  fs.writeFileAsync(path.join(site.publicDir, 'sitemap.xml'), xml)
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
  variables.slug = slugify(file.basename, slugifyOptions)
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
        slug: slugify(taxonomyName, slugifyOptions),
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
      'User-Agent': 'Tamago App',
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
 * Get content.
 * @param string dir
 * @param string slug
 * @return object content
 */
async function getContent (dir, slug) {
  let output = null
  await Promise.all(site[dir].map(async (content) => {
    if (content.slug === slug) {
      output = content
    }
  }))
  return output
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
    url: path.join(site.basepath, taxoSlug, termSlug),
    slug: slugify(term, slugifyOptions)
  }
}

/**
 * Load templates.
 * @return object templates.
 */
async function loadTemplates () {
  const files = await fs.readdirAsync(site.templatesDir)
  await Promise.all(files.map(async (filename) => {
    const templateName = path.basename(filename, '.mustache')
    const templatePath = path.join(site.templatesDir, filename)
    const templateContent = await fs.readFileAsync(templatePath, 'utf-8')
    site.templates[templateName] = templateContent.toString()
  }))
}

/**
 * Define site settings
 */
function defineSiteSettings () {
  const cwd = process.cwd()
  const settingsPath = path.join(cwd, '/settings.json')
  const overrides = fs.statAsync(settingsPath) ? require(settingsPath) : []
  const settings = {
    title: 'Tamago website',
    baseurl: '',
    basepath: '',
    home: {
      where: 'indexes',
      slug: 'posts'
    },
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
    ],
    templates: [],
    posts: [],
    pages: [],
    indexes: []
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
      console.error(err)
      return
    }
    console.log(stdout)
  })
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
  await mkdirp.mkdirpAsync(path.join(site.publicDir, 'files'))
  execAndLog(`cp -r files ${site.publicDir}/`)
}

/**
 * Build libs.
 */
async function buildLibs () {
  fs.statAsync('assets/libs').then(async () => {
    execAndLog(`cp -r assets/libs ${site.publicDir}/`)
  }).catch(error => {
    console.log('[Libs] Dir assets/libs does not exist.')
  })
}

/**
 * Build images.
 */
async function buildImages () {
  fs.statAsync('assets/img').then(async () => {
    execAndLog(`cp -r assets/img ${site.publicDir}/`)
    //execAndLog(`imagemin assets/img ${site.publicDir}/img -p`)
  }).catch(error => {
    console.log('[Img] Dir assets/img does not exist.')
  })
}

/**
 * Build CSS.
 */
async function buildCSS () {
  site.styles = []
  await mkdirp.mkdirpAsync(path.join(site.publicDir, 'css'))
  const input = path.join(site.cwd, 'assets/scss/app.scss')
  const output = path.join(site.cwd, site.publicDir, 'css/app.css')
  sass.render({
    file: input
  }, async (err, sassResult) => {
    if (err) {
      console.error('[CSS] ' + err)
    }
    const postResult = await postcss([autoprefixer]).process(sassResult.css)
    postResult.warnings().forEach(warn => {
      console.warn('[CSS] ' + warn.toString())
    })
    fs.writeFileAsync(output, postResult.css)
  })
  site.styles.push(path.join(site.basepath, 'css/app.css'))
}

/**
 * Build JS.
 */
async function buildJS () {
  site.scripts = []
  fs.statAsync('assets/js').then(async () => {
    await mkdirp.mkdirpAsync(path.join(site.publicDir, 'js'))
    execAndLog(`cp -r assets/js ${site.publicDir}/`)
    //execAndLog(`babel assets/js --out-file ${site.publicDir}/js/app.js`)
    site.scripts.push(path.join(site.basepath, 'js/app.js'))
  }).catch(error => {
    console.error('[JS] Dir assets/js does not exist.')
  })
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
  console.log(`$ tamago build`)
}

/**
 * Help.
 */
function help () {
  console.log('⚠️ Commands are:')
  console.log('🚀 tamago init "My website": init directory')
  console.log('🔧 tamago build: build your website')
}