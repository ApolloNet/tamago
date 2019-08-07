'use strict'

const path = require('path')
const fs = require('fs-extra')
const handlebars = require('handlebars')
const sharp = require('sharp')

/**
 * Build styleguide.
 * @param object site
 */
function buildstyleGuide (site) {
  const styleguideTpl = handlebars.compile(site.templates['styleguide'])
  const layoutTpl = handlebars.compile(site.templates['layout'])
  const styleguide =site.styleguide
  styleguide.imageDerivatives = formatExampleImage(site)
  const styleguideContent = {
    site: site,
    title: "Styleguide",
    styles: site.styles,
    scripts: site.scripts,
    content: styleguideTpl(styleguide)
  }
  const html = layoutTpl(styleguideContent)
  const dest = path.join(site.publicDir, 'styleguide.html')
  fs.writeFile(dest, html)
    .catch(err => console.error(err))
  return site
}

/**
 * Format example image derivatives.
 * @return object imageDerivatives
 */
function formatExampleImage (site) {
  const imagePath = 'files/example.jpg'
  const imageBasename = path.basename(imagePath)
  const imageExists = fs.existsSync(imagePath)
  if (!imageExists) {
    console.error(`♠️ Could not create derivatives from ${imagePath}`)
  }
  const imageDerivatives = site.imageFormats.map(format => {
    const formatDir = path.join(site.publicDir, 'files', format.name)
    const outputPath = path.join(formatDir, imageBasename)
    const outputSrc = path.join(site.basepath, 'files', format.name, imageBasename)
    fs.ensureDirSync(formatDir)
    sharp(imagePath).resize(format.width, format.height).toFile(outputPath)
    return {
      name: format.name,
      src: outputSrc,
      width: format.width,
      height: format.height
    }
  })
  return imageDerivatives
}

module.exports = buildstyleGuide