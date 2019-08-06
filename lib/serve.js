'use strict'

const {exec} = require('child_process')

const chokidar = require('chokidar')

const build = require('./build')
const defineSettings = require('./define-settings')

/**
 * Watch and serve.
 * @param object site
 */
function serve (site) {
  exec(`http-server ${site.publicDir}`)
  console.log(`♣️ Website is served at http://localhost:8080/`)
  console.log('Watching changes...')
  chokidar.watch('.', {
    ignored: site.ignoreDirs
  }).on('change', path => {
    console.log(`\nFile ${path} has been changed`)
    site = defineSettings()
    build(site)
  })
}

module.exports = serve