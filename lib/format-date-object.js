'use strict'

const util = require('util')
const format = require('date-fns/format')
const getHours = require('date-fns/getHours')
const getMinutes = require('date-fns/getMinutes')
const fr = require('date-fns/locale/fr')

/**
 * Format date object
 * @param object site
 * @param string dateStartString
 * @param string dateEndString
 * @return object date
 */
function formatDateObject (site, dateStartString, dateEndString) {
  const output = {
    start: null,
    end: null,
    render: null
  }
  const dateStart = new Date(dateStartString)
  const dateEnd = dateEndString ? new Date(dateEndString) : null
  // Date start.
  output.start = {
    // If time is 00:00, content is considered "all day long".
    allDay: (getHours(dateStart) == 0 && getMinutes(dateStart) == 0),
    timestamp: format(dateStart, 'X')
  }
  site.dateFormats.map(dateFormat => {
    output.start[dateFormat.name] = format(
      dateStart,
      dateFormat.format,
      {locale: fr}
    )
  })
  output.render = output.start.allDay
    ? output.start.short
    : output.start.long
  // Date end.
  if (dateEnd) {
    output.end = {
      timestamp: format(dateEnd, 'X')
    }
    site.dateFormats.map(dateFormat => {
      output.end[dateFormat.name] = format(
        dateEnd,
        dateFormat.format,
        {locale: fr}
      )
    })
    output.render = util.format(
      site.dateMultipleFormat,
      output.start.short,
      output.end.short
    )
  }
  // Return.
  return output
}

module.exports = formatDateObject