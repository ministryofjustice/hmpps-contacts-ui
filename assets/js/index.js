import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import * as ContactsFrontend from './all'

govukFrontend.initAll()
mojFrontend.initAll()
ContactsFrontend.initAll()
window.MojFrontend = mojFrontend

window.onload = function () {
  // Loops through dom and finds all elements with card--clickable class
  // load on each page there will only be matches on the relevant pages
  document.querySelectorAll('.card--clickable').forEach(card => {
    // Check if card has a link within it
    if (card.querySelector('a') !== null) {
      // Clicks the link within the heading to navigate to desired page
      card.addEventListener('click', () => {
        card.querySelector('a').click()
      })
    }
  })
}
