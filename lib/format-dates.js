'use strict'

const formatDateObject = require('./format-date-object')

/**
 * Format date.
 * @param object site
 * @param object variables
 * @param string field
 * @return object variables
 */
function formatDates (site, variables, field) {
  if (!variables[field]) {
    return variables
  }
  // Turn string into array.
  const dates = Array.isArray(variables[field])
    ? variables[field]
    : Array(variables[field])
  // Format.
  const datesObjects = dates.map(date => {
    const dateSplit = date.split(' - ')
    return formatDateObject(site, dateSplit[0], dateSplit[1])
  })
  // Re-turn to string if input was a string.
  variables[field] = Array.isArray(variables[field])
    ? datesObjects
    : datesObjects[0]
  // Add a 'date' field for sorting.
  if (field === 'dates' && !variables['date']) {
    variables['date'] = variables['dates'][0]
  }
  return variables
}

module.exports = formatDates