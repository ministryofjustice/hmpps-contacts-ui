import accessibleAutocomplete from 'accessible-autocomplete'

function escapeHtml(str) {
  if (typeof str !== 'string') {
    return ''
  }

  const escapeCharacter = match => {
    switch (match) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&#039;'
      case '`':
        return '&#096;'
      default:
        return match
    }
  }

  return str.replace(/[&<>"'`]/g, escapeCharacter)
}

function AutoComplete(meta) {
  this.meta = meta

  var autocompleteElements = this.meta.content.split(',')
  autocompleteElements.forEach(el => {
    var selectElement = document.querySelector('#' + el)
    accessibleAutocomplete.enhanceSelectElement({
      selectElement,
      showAllValues: true,
      preserveNullOptions: true,
      templates: {
        suggestion: option => escapeHtml(option), // escape html which may have been injected to the component
      },
    })

    selectElement = document.querySelector('#' + el)
    // By default accessible-autocomplete creates an input element with type="text".
    // We want to use type="search" to enable the clear button (cross) on these inputs
    selectElement.setAttribute('type', 'search')

    // There is a bug(?) where the scroll bar of a child element will trigger a "blur" event when it has a parent with a
    // tabindex of -1. Because dialogs typically use tabindex=-1 to recieve programmatic focus, and this autocomplete
    // component uses blur events to close the autocomplete menu, it means the autocomplete will close when using the
    // scroll bar. This fix adds a tabindex=-1 to the wrapper of the autocomplete then supresses blur events that occur
    // within the wrapper such as clicking scrollbars.
    selectElement.parentNode.setAttribute('tabindex', -1)
    selectElement.parentNode.addEventListener(
      'blur',
      e => {
        if (e.relatedTarget && e.relatedTarget.classList.contains('autocomplete__wrapper')) {
          e.stopImmediatePropagation()
          setTimeout(() => selectElement.focus(), 10)
        }
      },
      true,
    )
  })
}

function nodeListForEach(nodes, callback) {
  if (window.NodeList.prototype.forEach) {
    return nodes.forEach(callback)
  }
  nodes.forEach((node, i) => {
    callback.call(window, node, i, nodes)
  })
}

function initAll() {
  var $autoCompleteElements = document.getElementsByName('autocompleteElements')
  nodeListForEach($autoCompleteElements, function ($autoCompleteElements) {
    new AutoComplete($autoCompleteElements)
  })

  const $headings = Array.from(document.querySelectorAll('th'))
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

export { initAll }
