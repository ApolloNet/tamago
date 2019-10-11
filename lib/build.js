'use strict'

const fs = require('fs-extra')
const recursive = require('recursive-readdir')
const buildCopy = require('./build-copy')
const createFileObject = require('./create-file-object')

/**
 * Parse directories.
 */
async function build () {
  try {
    let site = require('./define-settings')()
    site = require('./build-clean')(site)
    site = require('./load-templates')(site)
    site = await require('./build-copies')(site)
    site = await require('./build-css')(site)
    site = await require('./build-js')(site)
    site = await require('./build-blocks')(site)
    site = await require('./build-contents')(site)
    site = require('./build-taxonomies')(site)
    site = require('./build-indexes')(site)
    site = require('./build-home')(site)
    site = require('./build-geo')(site)
    require('./build-sitemap')(site)
    site = require('./build-styleguide')(site)
    console.log("♥️ Website built successfully.")
  }
  catch (err) {
    console.error(`♠️ ${err}`)
  }
}

module.exports = build