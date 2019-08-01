'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer')
const fs = require('fs-extra')
const sass = require('node-sass')
const postcss = require('postcss')

/**
 * Build CSS.
 * @param object site
 * @param object file
 */
function buildCSS (site, file) {
  if (file.name[0] === '_') {
    return site
  }
  file.dir = 'assets/css'
  fs.ensureDirSync(path.join(site.publicDir, file.dir))
  const output = {
    path: path.join(site.publicDir, file.dir, file.name + '.css'),
    url: path.join(site.basepath, file.dir, file.name + '.css')
  }
  sass.render({
    file: file.path
  }, (err, sassResult) => {
    if (err) {
      console.error(err)
    }
    const postResult = postcss([autoprefixer])
      .process(sassResult.css, {from: undefined})
    postResult.warnings().forEach(warn => {
      console.warn(warn.toString())
    })
    fs.writeFile(output.path, postResult.css)
  })
  site.styles.push(output.url)
  return site
}

module.exports = buildCSS