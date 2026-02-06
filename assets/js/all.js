import { nodeListForEach } from './utils'
import AutoComplete from './autocomplete'
import { upArrowSvg, downArrowSvg, upDownArrowSvg } from '../../server/utils/sortableIcons'

const $upArrow = upArrowSvg
const $downArrow = downArrowSvg
const $upDownArrow = upDownArrowSvg

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

    // If an anchor exists and already contains an inline SVG rendered by the server,
    // leave it alone to avoid redundant DOM updates and flicker.
    if ($anchor && $anchor.querySelector('svg')) continue

    // For legacy (button) markup or anchor with no SVG, remove any existing SVG before inserting
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
