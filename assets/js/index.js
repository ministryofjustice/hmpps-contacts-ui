import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import * as ContactsFrontend from './all'

govukFrontend.initAll()
mojFrontend.initAll()
ContactsFrontend.initAll()
window.MojFrontend = mojFrontend

export default {
  ...ContactsFrontend,
}
