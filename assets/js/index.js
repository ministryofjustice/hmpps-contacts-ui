import $ from 'jquery'
import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import * as ContactsFrontend from './all'

window.$ = $
govukFrontend.initAll()
mojFrontend.initAll()
ContactsFrontend.initAll()

export default {
  ...ContactsFrontend,
}
