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
    publicDir: 'public',
    exclude: ['settings.json', 'public'],
    templatesDir: 'templates',
    contentTypes: ['pages', 'posts'],
    filesDirs: ['files'],
    taxonomiesNames: ['tags'],
    indexes: [
      {
        dir: 'posts',
        title: 'Posts'
      }
    ],
    paginate: 10,
    home: {
      where: 'indexes',
      slug: 'posts'
    },
    dateFields: ['date'],
    dateFormats: [
      {
        name: 'short',
        format: 'D MMMM YYYY'
      },
      {
        name: 'long',
        format: 'D MMMM YYYY - H:mm'
      }
    ],
    dateMultipleFormat: 'From %s to %s',
    geoFields: ['address'],
    mapZoom: 12,
    imageFields: ['image'],
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
    styles: [],
    scripts: [],
    styleguide: {},
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
  return site
}

module.exports = defineSettings