'use strict'

const handlebars = require('handlebars')
const formatContent = require('./format-content')

/**
 * Build block.
 * @param object site
 * @param object file
 * @return object site
 */
function buildBlock (site, file) {
  file.variables = formatContent(site, file)
  const blockTpl = handlebars.compile(site.templates['block'])
  file.html = blockTpl(file.variables)
  site.blocks[file.slug] = file
  return site
}

module.exports = buildBlock