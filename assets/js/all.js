import { nodeListForEach } from './utils'
import AutoComplete from './autocomplete'

const $upArrow = `<svg width="22" height="22" focusable="false" aria-hidden="true" role="img" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.5625 15.5L11 6.63125L15.4375 15.5H6.5625Z" fill="currentColor"/>
</svg>`
const $downArrow = `<svg width="22" height="22" focusable="false" aria-hidden="true" role="img" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.4375 7L11 15.8687L6.5625 7L15.4375 7Z" fill="currentColor"/>
</svg>`
const $upDownArrow = `<svg width="22" height="22" focusable="false" aria-hidden="true" role="img" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.1875 9.5L10.9609 3.95703L13.7344 9.5H8.1875Z" fill="currentColor"/>
<path d="M13.7344 12.0781L10.9609 17.6211L8.1875 12.0781H13.7344Z" fill="currentColor"/>
</svg>`

function initAll() {
  var $autoCompleteElements = document.getElementsByName('autocompleteElements')
  nodeListForEach($autoCompleteElements, function ($autoCompleteElements) {
    new AutoComplete($autoCompleteElements)
  })

  const $headings = Array.from(document.querySelectorAll('th'))
  for (const $heading of $headings) {
    const $button = $heading.querySelector('button')
    if ($heading.hasAttribute('aria-sort') && $button) {
      var _$button$querySelector
      const direction = $heading.getAttribute('aria-sort')
      ;(_$button$querySelector = $button.querySelector('svg')) == null || _$button$querySelector.remove()
      switch (direction) {
        case 'ascending':
          $button.insertAdjacentHTML('beforeend', $upArrow)
          break
        case 'descending':
          $button.insertAdjacentHTML('beforeend', $downArrow)
          break
        default:
          $button.insertAdjacentHTML('beforeend', $upDownArrow)
      }
    }
  }
}

export { initAll, AutoComplete }
