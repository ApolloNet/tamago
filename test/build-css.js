'use strict'

const os = require('os')
const path = require('path')

const test = require('ava')
const fs = require('fs-extra')

const buildCSS = require('../lib/build-css.js')
const createFileObject = require('../lib/create-file-object.js')
const defineSettings = require('../lib/define-settings')
const loadTemplates = require('../lib/load-templates')

function doBuildCSS () {
  let site = defineSettings(__dirname)
  site = loadTemplates(site)
  site.publicDir = fs.mkdtempSync(os.tmpdir() + path.sep)
  const scssFile = createFileObject(site, 'lib/defaults/assets/scss/app.scss')
  site = buildCSS(site, scssFile)
  return site
}

test('Test build CSS: site.styles is set', t => {
  const site = doBuildCSS()
  t.deepEqual(site.styles[0], '/assets/css/app.css')
})

test('Test build CSS: css file is created', t => {
  const site = doBuildCSS()
  const cssFile = path.join(site.publicDir, '/assets/css/app.css')
  t.true(fs.accessSync(cssFile) === undefined ? true : false)
})