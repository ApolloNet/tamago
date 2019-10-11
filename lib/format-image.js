'use strict'

const path = require('path')
const fs = require('fs-extra')
const sharp = require('sharp')

/**
 * Format image.
 * @param object site
 * @param object variables
 * @param string image
 * @return object variables
 */
function formatImage (site, variables, field) {
  if (!variables[field]) {
    variables.hasImage = false
    return variables
  }
  const imagePath = path.isAbsolute(variables[field])
    ? '.' + variables[field]
    : variables[field]
  const imageBasename = path.basename(imagePath)
  const imageExists = fs.existsSync(imagePath)
  if (!imageExists) {
    variables.hasImage = false
    return variables
  }
  variables.hasImage = true
  variables.imageDerivatives = {
    original: variables[field]
  }
  site.imageFormats.map(format => {
    site.filesDirs.map(dir => {
      const formatDir = path.join(site.publicDir, dir, format.name)
      const outputPath = path.join(formatDir, imageBasename)
      const outputSrc = path.join(site.basepath, dir, format.name, imageBasename)
      fs.ensureDirSync(formatDir)
      sharp(imagePath).resize(format.width, format.height).toFile(outputPath)
      variables.imageDerivatives[format.name] = {
        src: outputSrc,
        width: format.width,
        height: format.height
      }
    })
  })
  return variables
}

module.exports = formatImage