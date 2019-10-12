#!/usr/bin/env node
'use strict'

const process = require('process')
const build = require('../lib/build')
const init = require('../lib/init')
const help = require('../lib/help')
const serve = require('../lib/serve')

// Let's
go()

/**
 * Go.
 */
function go () {
  const args = process.argv.slice(2)
  const cmd = args.length ? args[0] : 'help'
  const commands = {
    'help': help,
    'h': help,
    'init': init,
    'i': init,
    'build': build,
    'b': build,
    'serve': serve,
    's': serve,
    'watch': serve,
    'w': serve
  }
  commands[cmd](args[1])
}
