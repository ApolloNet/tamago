#!/usr/bin/env node
'use strict'

const process = require('process')

const build = require('./build')
const defineSettings = require('./define-settings')
const init = require('./init')

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