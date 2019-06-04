'use strict'

const os = require('os')
const path = require('path')

const test = require('ava')
const fs = require('fs-extra')

const defineSettings = require('../lib/define-settings')
const buildSitemap = require('../lib/build-sitemap')
const loadTemplates = require('../lib/load-templates')

test('Test build sitemap', t => {
  let site = defineSettings(__dirname)
  site = loadTemplates(site)
  site.publicDir = fs.mkdtempSync(os.tmpdir() + path.sep)
  const sitemapExists = buildSitemap(site)
  t.true(sitemapExists)
})