'use strict'

/**
 * Format blocks.
 * @param object site
 * @param object blocksTree
 * @return object
 */
function formatBlocks (site, blocksTree) {
  if (!blocksTree) {
    return
  }
  const blocks = {}
  Object.keys(blocksTree).map(region => {
    const blockNames = blocksTree[region]
    blocks[region] = {}
    blockNames.map(blockName => {
      blocks[region][blockName] = site.blocks[blockName]
    })
  })
  return blocks
}

module.exports = formatBlocks