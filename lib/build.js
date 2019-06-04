'use strict'

const fs = require('fs-extra')
const recursive = require('recursive-readdir');

const buildContent = require('./build-content')
const buildCopy = require('./build-copy')
const buildCSS = require('./build-css')
const buildHome = require('./build-home')
const buildIndex = require('./build-index')
const buildJS = require('./build-js')
const {buildTaxonomies} = require('./build-taxonomies')
const buildSitemap = require('./build-sitemap')
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
      site.indexesNames.map(index => {
        if (!site[index]) {
          return
        }
        const title = index.charAt(0).toUpperCase() + index.slice(1)
        site = buildIndex(site, site[index], index, title)
      })
      buildHome(site)
      buildSitemap(site)
    })
    .catch(err => console.log(err))
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