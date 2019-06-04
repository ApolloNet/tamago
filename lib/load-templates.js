'use strict'

const path = require('path')

const fs = require('fs-extra')

const createFileObject = require('./create-file-object')

/**
 * Load templates.
 * @param object site
 * @return object site
 */
function loadTemplates (site) {
  const templatesDir = path.resolve(site.templatesDir)
  const templateFiles = fs.readdirSync(templatesDir)
  templateFiles.map(filepath => {
    const file = createFileObject(site, path.join(templatesDir, filepath))
    site = loadTemplate(site, file)
  })
  return site
}

/**
 * Load template.
 * @param object site
 * @param object file
 * @return object site
 */
function loadTemplate (site, file) {
  const template = fs.readFileSync(file.path)
  site.templates[file.name] = template.toString()
  return site
}

module.exports = loadTemplates