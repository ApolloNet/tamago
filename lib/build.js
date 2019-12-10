'use strict'

const fs = require('fs-extra')
const path = require('path')

/**
 * Parse directories.
 */
async function build () {
  let site = require('./define-settings')()
  const promise = Promise.resolve(site)
  for (const moduleName of site.modules) {
    await promise.then(site => handleModule(site, moduleName))
  }
  promise.then(() => console.log("♥️ Website built successfully."))
  promise.catch(err => console.error(err))
}

/**
 * Handle module.
 * @param object site
 * @param string moduleName
 * @return promise
 */
function handleModule (site, moduleName) {
  const modulePath = path.join(__dirname, `${moduleName }.js`)
  return fs.stat(modulePath)
    .then(() => require(modulePath)(site))
    .catch(err => console.error(err))
}

module.exports = build