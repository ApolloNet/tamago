'use strict'

const path = require('path')

const fs = require('fs-extra')
const slugify = require('slugify')

/**
 * Init.
 * @param object site
 * @param string name
 */
function init (site, name) {
  const nameSlug = slugify(name, site.slugifyOptions)
  const defaultsDir = `${__dirname}/defaults`
  const newSettings = JSON.stringify({
    title: name,
    baseurl: '',
    basepath: '',
    taxonomiesNames: ['tags']
  })
  // Create dirs.
  fs.ensureDirSync(nameSlug)
  fs.ensureDirSync(path.join(nameSlug, site.publicDir))
  // Copy defaults.
  fs.copy(defaultsDir, nameSlug)
    .catch(err => console.error(err))
  // Create settings file.
  fs.writeFile(
    path.join(nameSlug, 'settings.json'),
    newSettings, 'utf8', () => {}
  )
  // Log.
  console.log(`Project "${name}" is created in the directory "${nameSlug}"`)
  console.log(`Adjust the config in its settings.json file`)
  console.log(`Next steps:`)
  console.log(`$ cd ${nameSlug}`)
  console.log(`$ tamago build`)
}

module.exports = init