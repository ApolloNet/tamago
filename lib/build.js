'use strict'

const fs = require('fs-extra')
const recursive = require('recursive-readdir');

const buildContent = require('./build-content')
const buildCopy = require('./build-copy')
const buildCSS = require('./build-css')
const buildHome = require('./build-home')
const buildGeo = require('./build-geo')
const {buildIndexes} = require('./build-indexes')
const buildJS = require('./build-js')
const {buildTaxonomies} = require('./build-taxonomies')
const buildSitemap = require('./build-sitemap')
const buildstyleGuide = require('./build-styleguide')
const createFileObject = require('./create-file-object')
const loadTemplates = require('./load-templates')

/**
 * Parse directories.
 * @param object site
 */
function build (site) {
  const buildFunctions = getBuildFunctions(site)
  // Clean public dir.
  fs.removeSync(site.publicDir)
  // Templates.
  site = loadTemplates(site)
  // Build assets.
  recursive('assets', site.exclude)
    .then(files => {
      files.map(filepath => {
        // Exclude dot files.
        if (filepath[0] === '.') {
          return
        }
        const file = createFileObject(site, filepath)
        const buildFunction = buildFunctions.get(file.dir) || buildCopy
        site = buildFunction(site, file)
      })
      return site
    })
    // Build other files.
    .then(site => {
      return recursive('.', [...site.exclude, ...['assets']])
    })
    .then(files => {
      files.map(filepath => {
        // Exclude dot files.
        if (filepath[0] === '.') {
          return
        }
        const file = createFileObject(site, filepath)
        const buildFunction = buildFunctions.get(file.dir) || buildCopy
        site = buildFunction(site, file)
      })
      return site
    })
    // Other builds.
    .then(site => {
      site = buildTaxonomies(site)
      site = buildIndexes(site)
      buildHome(site)
      buildGeo(site)
      buildSitemap(site)
      buildstyleGuide(site)
    })
    .then(() => console.log("♥️ Website built successfully."))
    .catch(err => console.error(`♠️ ${err}`))
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

module.exports = build