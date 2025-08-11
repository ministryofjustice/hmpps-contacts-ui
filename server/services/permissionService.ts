import { PermissionsService as PrisonPermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger from '../../logger'
import { dataAccess } from '../data'
import config from '../config'

// Get data access objects
const { contactsApiClient, applicationInsightsClient } = dataAccess()

const createOptions: any = {
  prisonerSearchConfig: config.apis.prisonerSearchApi,
  authenticationClient: new AuthenticationClient(config.apis.hmppsAuth, logger, contactsApiClient.tokenStore),
  logger,
}
if (applicationInsightsClient) {
  createOptions.telemetryClient = applicationInsightsClient
}

const prisonPermissionsService = PrisonPermissionsService.create(createOptions)

export default prisonPermissionsService
