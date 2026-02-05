import { nodeListForEach } from './utils'
import AutoComplete from './autocomplete'

const $upArrow = `<svg width="22" height="22" focusable="false" aria-hidden="true" role="img" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5625 15.5L11 6.63125L15.4375 15.5H6.5625Z" fill="currentColor"/></svg>`
const $downArrow = `<svg width="22" height="22" focusable="false" aria-hidden="true" role="img" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.4375 7L11 15.8687L6.5625 7L15.4375 7Z" fill="currentColor"/></svg>`
const $upDownArrow = `<svg width="22" height="22" focusable="false" aria-hidden="true" role="img" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.1875 9.5L10.9609 3.95703L13.7344 9.5H8.1875Z" fill="currentColor"/><path d="M13.7344 12.0781L10.9609 17.6211L8.1875 12.0781H13.7344Z" fill="currentColor"/></svg>`

function initAll() {
  var $autoCompleteElements = document.getElementsByName('autocompleteElements')
  nodeListForEach($autoCompleteElements, function ($autoCompleteElements) {
    new AutoComplete($autoCompleteElements)
  })

  // Update sortable table headings icons. Support both legacy markup (button inside anchor)
  // and new markup (anchor-only with inline SVG). We only insert an icon when none exists.
  const $headings = Array.from(document.querySelectorAll('th'))
  for (const $heading of $headings) {
    if (!$heading.hasAttribute('aria-sort')) continue

    const direction = $heading.getAttribute('aria-sort')

    // Prefer anchor if present, otherwise fall back to button (legacy)
    const $anchor = $heading.querySelector('a')
    const $button = $heading.querySelector('button')

    // target element we'll insert icon into
    const $target = $anchor || $button
    if (!$target) continue

    // if there is already an svg inside target, remove it and re-insert the correct one
    const existingSvg = $target.querySelector('svg')
    if (existingSvg) existingSvg.remove()

    switch (direction) {
      case 'ascending':
        $target.insertAdjacentHTML('beforeend', $upArrow)
        break
      case 'descending':
        $target.insertAdjacentHTML('beforeend', $downArrow)
        break
      default:
        $target.insertAdjacentHTML('beforeend', $upDownArrow)
    }
  }
}

export { initAll, AutoComplete }
