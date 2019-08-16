'use strict'

const fs = require('fs-extra')
const recursive = require('recursive-readdir');

const buildBlocks = require('./build-blocks')
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
async function build (site) {
  try {
    fs.removeSync(site.publicDir)
    site = loadTemplates(site)
    site = await handleDirs(site)
    site = buildTaxonomies(site)
    site = buildIndexes(site)
    site = buildHome(site)
    site = buildGeo(site)
    buildSitemap(site)
    site = buildstyleGuide(site)
    console.log("♥️ Website built successfully.")
  }
  catch (err) {
    console.error(`♠️ ${err}`)
  }
}

/**
 * Handle dirs.
 * @param object site
 * @return object site
 */
async function handleDirs (site) {
  const buildFunctions = getBuildFunctions(site)
  const dirs = Object.keys(buildFunctions)
  const exclude = [...site.exclude, ...dirs]
  dirs.map(async dir => {
    if (!fs.existsSync(dir)) {
      return
    }
    site = await handleDir(site, buildFunctions[dir], dir, exclude)
  })
  site = await handleDir(site, buildCopy, '.', exclude)
  return site
}

/**
 * Handle dir.
 * @param object site
 * @param function buildFunction
 * @param string dir
 * @param array exclude
 * @return object site
 */
async function handleDir (site, buildFunction, dir, exclude) {
  const files = await recursive(dir, exclude)
  files.map(filepath => {
    const file = createFileObject(site, filepath)
    site = buildFunction(site, file)
  })
  return site
}

/**
 * Get build function.
 * @param object site
 * @return object buildFunctions
 */
function getBuildFunctions (site) {
  const buildFunctions = {
    'assets/favicons': buildCopy,
    'assets/fonts': buildCopy,
    'assets/img': buildCopy,
    'assets/libs': buildCopy,
    'assets/scss': buildCSS,
    'assets/js': buildJS,
    'blocks': buildBlocks
  }
  site.contentTypes.map(contentType => {
    buildFunctions[contentType] = buildContent
  })
  site.filesDirs.map(filesDir => {
    buildFunctions[filesDir] = buildCopy
  })
  return buildFunctions
}

module.exports = build