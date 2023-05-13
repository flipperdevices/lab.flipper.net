/**
    @file Various utils.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

/** Returns element or expands selector. */
export function selector (elementOrSelector) {
  if (!elementOrSelector) {
    return elementOrSelector
  } else if (typeof elementOrSelector === 'string') {
    return document.querySelector(elementOrSelector)
  } else {
    return elementOrSelector // instanceof Element
  }
}

/** Returns array or expands key. */
export function lookup (table, arrayOrKey) {
  if (!arrayOrKey) { return arrayOrKey }
  if (typeof arrayOrKey !== 'string') { return arrayOrKey }
  if (table[arrayOrKey]) { return table[arrayOrKey] }
  const match = arrayOrKey.toLowerCase()
  for (const key in table) {
    if (key.toLowerCase() === match) { return table[key] }
  }
  for (const key in table) {
    if (key.toLowerCase().startsWith(match)) { return table[key] }
  }
  return null
}

/** Strips HTML tags. */
export function strip (html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}
