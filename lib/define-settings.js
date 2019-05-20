'use strict'

const path = require('path')

const fs = require('fs-extra')

/**
 * Define site settings
 * @param rootPath string
 * @return site object
 */
function defineSettings (rootPath) {
  const cwd = rootPath || process.cwd()
  const settingsPath = path.join(cwd, 'settings.json')
  const overrides = fs.existsSync(settingsPath) ? require(settingsPath) : []
  const site = {
    title: 'Tamago website',
    baseurl: '',
    basepath: '/',
    home: {
      where: 'indexes',
      slug: 'posts'
    },
    publicDir: 'public',
    paginate: 10,
    templatesDir: 'templates',
    contentTypes: ['pages', 'posts'],
    filesDirs: ['files'],
    ignoreDirs: ['.git', 'public'],
    indexesNames: ['posts'],
    taxonomiesNames: ['tags'],
    dateFormat: 'D MMMM YYYY',
    mapZoom: 12,
    imageFormats: [
      {
        name: 'thumbnail',
        width: 300,
        height: 200
      },
      {
        name: 'large',
        width: 960,
        height: 480
      }
    ],
    templates: [],
    indexes: [],
    styles: [],
    scripts: [],
    slugifyOptions: {
      remove: /[*+~.()'"!:@]/g,
      lower: true
    }
  }
  Object.keys(site).map(setting => {
    site[setting] = overrides[setting] ? overrides[setting] : site[setting]
  })
  site.contentTypes.map(type => {
    site[type] = []
  })
  //console.log(site)
  return site
}

module.exports = defineSettings