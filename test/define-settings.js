'use strict'

const test = require('ava')

const defineSettings = require('../lib/define-settings.js')

test('Test Define settings with override', t => {
  const site = defineSettings(__dirname)
  t.is(site.title, "Setten")
  t.deepEqual(site.contentTypes, ["pages", "events"])
})