'use strict'

const path = require('path')

const fs = require('fs-extra')
const recursive = require('recursive-readdir');
const slugify = require('slugify')

const buildContent = require('./build-content')
const buildCopy = require('./build-copy')
const buildCSS = require('./build-css')
const buildHome = require('./build-home')
const buildIndex = require('./build-index')
const buildJS = require('./build-js')
const {buildTaxonomies} = require('./build-taxonomies')
const buildSitemap = require('./build-sitemap')

/**
 * Parse directories.
 * @param object site
 */
function build (site) {
  const buildFunctions = getBuildFunctions(site)
  // Clean public dir.
  fs.removeSync(site.publicDir)
  // Templates.
  recursive(site.templatesDir)
    .then(templateFiles => {
      templateFiles.map(filepath => {
        const file = createFileObject(site, filepath)
        loadTemplate(site, file)
      })
    })
    .catch(err => console.log(err))
  // Files builds.
  recursive('.', site.ignoreDirs)
    .then(files => {
      files.map(filepath => {
        const file = createFileObject(site, filepath)
        const buildFunction = buildFunctions.get(file.dir)
        if (!buildFunction) {
          return
        }
        site = buildFunction(site, file)
      })
      // Other builds.
      site = buildTaxonomies(site)
      if (site.posts) {
        site = buildIndex(site, site.posts, 'posts', 'Posts')
      }
      buildHome(site)
      buildSitemap(site)
    })
    .catch(err => console.log(err))
}

/**
 * Create file object.
 * @param object site
 * @param string filepath
 * @return object file
 */
function createFileObject (site, filepath) {
  const file = {}
  file.path = filepath
  file.dir = path.dirname(file.path)
  file.ext = path.extname(file.path)
  file.name  = path.basename(file.path, file.ext)
  file.slug = slugify(file.name, site.slugifyOptions)
  return file
}

/**
 * Get build function.
 * @param object site
 * @return Map functions
 */
function getBuildFunctions (site) {
  const builds = new Map();
  builds.set('assets/favicons', buildCopy)
  builds.set('assets/fonts', buildCopy)
  builds.set('assets/img', buildCopy)
  builds.set('assets/libs', buildCopy)
  builds.set('assets/scss', buildCSS)
  builds.set('assets/js', buildJS)
  site.contentTypes.map(contentType => {
    builds.set(contentType, buildContent)
  })
  site.filesDirs.map(filesDir => {
    builds.set(filesDir, buildCopy)
  })
  return builds
}

/**
 * Load template.
 * @param object site
 * @param object file
 */
function loadTemplate (site, file) {
  const template = fs.readFileSync(file.path)
  site.templates[file.name] = template.toString()
  console.log(`${file.path} template loaded`)
  return site
}

module.exports = build