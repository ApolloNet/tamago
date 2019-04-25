#!/usr/bin/env node
'use strict'

// Requires.
const process = require('process')
const { exec } = require('child_process')
const path = require('path')
const request = require('request')
// Third parties.
const autoprefixer = require('autoprefixer')
const fr = require('date-fns/locale/fr')
const fs = require('fs-extra')
const format = require('date-fns/format')
const marked = require('marked')
const matter = require('gray-matter')
const mustache = require('mustache')
const recursive = require('recursive-readdir');
const sass = require('node-sass')
const postcss = require('postcss')
const sharp = require('sharp')
const slugify = require('slugify')

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
 * Parse directories.
 */
async function build () {
  // Clean public dir.
  fs.removeSync(site.publicDir)
  // Files builds.
  const files = await recursive('.', site.ignoreDirs)
  await Promise.all(files.map(async filepath => {
    const file = createFileObject(filepath)
    const buildFunction = getBuildFunction(file.dir)
    if (!buildFunction) {
      return
    }
    await buildFunction(file)
  }))
  // Other builds.
  buildTaxonomies()
  if (site.posts) {
    buildIndex(site.posts, 'posts', 'Posts')
  }
  buildHome()
  buildSitemap()
}

/**
 * Create file object.
 * @param string filepath
 * @return object file
 */
function createFileObject (filepath) {
  const file = {}
  file.path = filepath
  file.dir = path.dirname(file.path)
  file.ext = path.extname(file.path)
  file.name  = path.basename(file.path, file.ext)
  file.slug = slugify(file.name, slugifyOptions)
  return file
}

/**
 * Get build function.
 * @param string dir
 * @return function
 */
function getBuildFunction (dir) {
  const builds = new Map();
  builds.set('assets/favicons', buildCopy)
  builds.set('assets/fonts', buildCopy)
  builds.set('assets/img', buildCopy)
  builds.set('assets/libs', buildCopy)
  builds.set('assets/scss', buildCSS)
  builds.set('assets/js', buildJS)
  builds.set(site.templatesDir, loadTemplate)
  site.contentTypes.map(contentType => {
    builds.set(contentType, buildContent)
  })
  site.filesDirs.map(filesDir => {
    builds.set(filesDir, buildCopy)
  })
  return builds.get(dir)
}

/**
 * Copy a file to the public directory.
 * @param object file
 */
function buildCopy (file) {
  file.pathSegments = file.path.split(path.sep)
  const destDir = file.dir === 'assets/favicons' 
    ? site.publicDir
    : path.join(site.publicDir, file.dir)
  const dest = path.join(destDir, file.name + file.ext)
  fs.ensureDirSync(destDir)
  fs.copy(file.path, dest)
    .then(() => console.log(`${file.path} copied`))
    .catch(err => console.error(err))
}

/**
 * Build contents.
 * @param object file
 */
async function buildContent (file) {
  fs.ensureDirSync(path.join(site.publicDir, file.dir))
  // File data.
  file.htmlpath = path.join(site.publicDir, file.dir, file.name + '.html')
  file.content = fs.readFileSync(file.path)
  file.variables = await fileFormatVariables(file)
  // Build site taxonomies.
  buildSiteTaxonomies(file)
  // Write HTML.
  const layoutContent = {
    site: site,
    styles: [...site.styles, ...file.variables.styles],
    scripts: [...site.scripts, ...file.variables.scripts],
    content: mustache.render(site.templates['article--full'], file.variables)
  }
  const html = mustache.render(site.templates['layout'], layoutContent)
  fs.writeFile(file.htmlpath, html)
    .then(() => console.log(`${file.path} built`))
    .catch(err => console.error(err))
  // 404.
  if (file.name === '404') {
    fs.copy(file.htmlpath, path.join(site.publicDir, '404.html'))
      .then(() => console.log('404.html created'))
      .catch(err => console.error(err))
  }
  // Load file variables in the site object.
  site[file.dir].push(file.variables)
}

/**
 * Build taxonomies object.
 * @param object file
 * @return object file
 */
function buildSiteTaxonomies (file) {
  if (!file.variables.taxonomies) {
    return
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
        slug: slugify(taxonomy.name, slugifyOptions),
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
        const termObject = createTerm(taxonomy.name, term.name)
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
 * Build taxonomies.
 * @return indexes
 */
function buildTaxonomies () {
  if (!site.taxonomies) {
    return
  }
  site.taxonomies.map(taxonomy => {
    taxonomy.terms.map(term => {
      const slug = taxonomy.slug + '-' + term.slug
      buildIndex(term.posts, term.path, term.name, slug)
    })
  })
}

/**
 * Build indexes HTML pages.
 * @param array contents
 * @param string dir
 * @param string title
 * @param string slug
 * @return array indexes
 */
async function buildIndex (contents, dir, title, slug) {
  fs.ensureDirSync(path.join(site.publicDir, dir))
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
    fs.writeFile(path.join(site.publicDir, dir, filename), html)
      .then(() => console.log(`${filename} index created`))
      .catch(err => console.log(err))
    // Return index.
    const index = {
      title: title,
      body: articlesHtml,
      url: path.join(dir, filename),
      slug: slug ? slug : slugify(title, slugifyOptions)
    }
    site.indexes.push(index)
  }))
}

/**
 * Build homepage.
 */
async function buildHome () {
  const home = await getContent(site.home.where, site.home.slug)
  const output = path.join(site.publicDir, 'index.html')
  const homeContent = {
    site: site,
    title: home.title,
    styles: site.styles,
    scripts: site.scripts,
    content: home.body
  }
  const html = mustache.render(site.templates['layout'], homeContent)
  fs.writeFile(output, html)
    .then(() => console.log('home built'))
    .catch(err => console.log(err))
  console.log(`${output} created`)
}

/**
 * Build sitemap.
 */
async function buildSitemap () {
  let contents = [...site.indexes]
  site.contentTypes.map(type => {
    contents = [...contents, ...site[type]]
  })
  const contentsXml = contents.map(content => {
    const fullUrl = path.join(site.baseurl, site.basepath, content.url)
    return mustache.render(site.templates['article--sitemap'], {url: fullUrl})
  }).join('\n')
  const xml = mustache.render(site.templates['sitemap'], {content: contentsXml})
  fs.writeFile(path.join(site.publicDir, 'sitemap.xml'), xml)
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
  variables.url = path.join(site.basepath, file.dir, file.name + '.html')
  variables.slug = slugify(file.name, slugifyOptions)
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
  const imageExists = fs.existsSync(imagePath)
  if (!imageExists) {
    variables.hasImage = false
    return
  }
  variables.hasImage = true
  variables.imageDerivatives = {
    original: variables[field]
  }
  await Promise.all(site.imageFormats.map(async (format) => {
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
 * Load template.
 * @param object file
 */
function loadTemplate (file) {
  const template = fs.readFileSync(file.path)
  site.templates[file.name] = template.toString()
  console.log(`${file.path} template loaded`)
}

/**
 * Define site settings
 */
function defineSiteSettings () {
  const cwd = process.cwd()
  const settingsPath = path.join(cwd, 'settings.json')
  const overrides = fs.existsSync(settingsPath) ? require(settingsPath) : []
  const settings = {
    title: 'Tamago website',
    baseurl: '',
    basepath: '/',
    home: {
      where: 'indexes',
      slug: 'posts'
    },
    cwd: cwd,
    publicDir: 'public',
    paginate: 10,
    templatesDir: 'templates',
    contentTypes: ['pages', 'posts'],
    filesDirs: ['files'],
    ignoreDirs: ['.git', 'public'],
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
    indexes: [],
    styles: [],
    scripts: []
  }
  Object.keys(settings).map(setting => {
    settings[setting] = overrides[setting] ? overrides[setting] : settings[setting]
  })
  settings.contentTypes.map(type => {
    settings[type] = []
  })
  //console.log(settings)
  site = settings
}

/**
 * Build CSS.
 * @param object file
 */
function buildCSS (file) {
  if (file.name[0] === '_') {
    return
  }
  file.dir = 'assets/css'
  fs.ensureDirSync(path.join(site.publicDir, file.dir))
  const output = {
    path: path.join(site.cwd, site.publicDir, file.dir, file.name + '.css'),
    url: path.join(site.basepath, file.dir, file.name + '.css')
  }
  sass.render({
    file: file.path
  }, async (err, sassResult) => {
    if (err) {
      console.error(err)
    }
    const postResult = await postcss([autoprefixer])
      .process(sassResult.css, {from: undefined})
    postResult.warnings().forEach(warn => {
      console.warn(warn.toString())
    })
    fs.writeFile(output.path, postResult.css)
    console.log(`${file.path} built`)
  })
  site.styles.push(output.url)
}

/**
 * Build JS.
 * @param object file
 */
function buildJS (file) {
  buildCopy(file)
  site.scripts.push(path.join(site.basepath, file.dir, file.name + file.ext))
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
  fs.ensureDirSync(nameSlug)
  fs.ensureDirSync(path.join(nameSlug, site.publicDir))
  // Copy defaults.
  fs.copy(defaultsDir, nameSlug)
    .then(() => console.log('[Defaults] Done.'))
    .catch(err => console.error('[Defaults] ' + err))
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