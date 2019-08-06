#!/usr/bin/env node
'use strict'

const process = require('process')

const build = require('../lib/build')
const defineSettings = require('../lib/define-settings')
const init = require('../lib/init')
const serve = require('../lib/serve')

// Let's
go()

/**
 * Go.
 */
function go () {
  const site = defineSettings()
  const args = process.argv.slice(2)
  if (args[0] === 'init' && args[1]) {
    init(site, args[1])
    return
  }
  if (args[0] === 'build') {
    build(site)
    return
  }
  if (args[0] === 'serve') {
    serve(site)
    return
  }
  help()
}

/**
 * Help.
 */
function help () {
  console.log('⚠️ Commands are:')
  console.log('🚀 tamago init "My website": init directory')
  console.log('🔧 tamago build: build your website')
}