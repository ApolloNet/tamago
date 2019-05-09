'use strict'

const assert = require('assert')

const defineSettings = require('../lib/define-settings.js')

const site = defineSettings(__dirname)

assert.equal(site.title, "Setten")
assert.deepStrictEqual(site.contentTypes, ["pages", "events"])