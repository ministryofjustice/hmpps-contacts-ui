import { nodeListForEach } from './utils'
import AutoComplete from './autocomplete'

function initAll() {
  var $autoCompleteElements = document.getElementsByName('autocompleteElements')
  nodeListForEach($autoCompleteElements, function ($autoCompleteElements) {
    new AutoComplete($autoCompleteElements)
  })
}

export { initAll, AutoComplete }
