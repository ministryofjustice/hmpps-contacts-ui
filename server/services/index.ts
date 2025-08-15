import { PermissionsService as PrisonPermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { dataAccess } from '../data'
import AuditService from './auditService'
import PrisonerSearchService from './prisonerSearchService'
import ContactsService from './contactsService'
import PrisonerImageService from './prisonerImageService'
import ReferenceDataService from './referenceDataService'
import RestrictionsService from './restrictionsService'
import PrisonerAddressService from './prisonerAddressService'
import OrganisationsService from './organisationsService'
import TelemetryService from './telemetryService'
import config from '../config'
import logger from '../../logger'

export const services = () => {
  const {
    applicationInfo,
    hmppsAuditClient,
    prisonerSearchApiClient,
    contactsApiClient,
    prisonApiClient,
    organisationsApiClient,
    applicationInsightsClient,
  } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const telemetryService = new TelemetryService(applicationInsightsClient)
  const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)
  const contactsService = new ContactsService(contactsApiClient, auditService, telemetryService)
  const prisonerImageService = new PrisonerImageService(prisonApiClient)
  const referenceDataService = new ReferenceDataService(contactsApiClient)
  const restrictionsService = new RestrictionsService(contactsApiClient, auditService)
  const prisonerAddressService = new PrisonerAddressService(prisonApiClient)
  const organisationsService = new OrganisationsService(organisationsApiClient)
  const permissionsService = PrisonPermissionsService.create({
    prisonerSearchConfig: config.apis.prisonerSearchApi,
    authenticationClient: new AuthenticationClient(config.apis.hmppsAuth, logger, contactsApiClient.tokenStore),
    logger,
    ...(applicationInsightsClient && { telemetryClient: applicationInsightsClient }),
  })

  return {
    applicationInfo,
    auditService,
    prisonerSearchService,
    contactsService,
    prisonerImageService,
    referenceDataService,
    restrictionsService,
    prisonerAddressService,
    organisationsService,
    telemetryService,
    permissionsService,
  }
}

export type Services = ReturnType<typeof services>

export {
  AuditService,
  PrisonerSearchService,
  ContactsService,
  PrisonerImageService,
  RestrictionsService,
  PrisonerAddressService,
}
