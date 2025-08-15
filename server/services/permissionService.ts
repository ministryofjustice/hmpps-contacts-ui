import { PermissionsService as PrisonPermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger from '../../logger'
import { dataAccess } from '../data'
import config from '../config'

// Get data access objects
const { contactsApiClient, applicationInsightsClient } = dataAccess()

const prisonPermissionsService = PrisonPermissionsService.create({
  prisonerSearchConfig: config.apis.prisonerSearchApi,
  authenticationClient: new AuthenticationClient(config.apis.hmppsAuth, logger, contactsApiClient.tokenStore),
  logger,
  ...(applicationInsightsClient && { telemetryClient: applicationInsightsClient }),
})

export default prisonPermissionsService
