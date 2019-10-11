#!/usr/bin/env node
'use strict'

const process = require('process')
const build = require('../lib/build')
const init = require('../lib/init')
const serve = require('../lib/serve')

// Let's
go()

/**
 * Go.
 */
function go () {
  const args = process.argv.slice(2)
  const commands = {
    'init': init,
    'build': build,
    'b': build,
    'serve': serve,
    's': serve,
    'watch': serve,
    'w': serve
  }
  commands[args[0]]
    ? commands[args[0]](args[1])
    : help()
}

/**
 * Help.
 */
function help () {
  console.log('⚠️ Commands are:')
  console.log('$ tamago init "My website"')
  console.log('$ tamago build')
  console.log('$ tamago serve')
}