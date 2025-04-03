import { dataAccess } from '../data'
import AuditService from './auditService'
import PrisonerSearchService from './prisonerSearchService'
import ContactsService from './contactsService'
import PrisonerImageService from './prisonerImageService'
import ReferenceDataService from './referenceDataService'
import RestrictionsService from './restrictionsService'
import PrisonerAddressService from './prisonerAddressService'
import OrganisationsService from './organisationsService'

export const services = () => {
  const {
    applicationInfo,
    hmppsAuditClient,
    prisonerSearchApiClient,
    contactsApiClient,
    prisonApiClient,
    organisationsApiClient,
  } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)
  const contactsService = new ContactsService(contactsApiClient, auditService)
  const prisonerImageService = new PrisonerImageService(prisonApiClient)
  const referenceDataService = new ReferenceDataService(contactsApiClient)
  const restrictionsService = new RestrictionsService(contactsApiClient)
  const prisonerAddressService = new PrisonerAddressService(prisonApiClient)
  const organisationsService = new OrganisationsService(organisationsApiClient)

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
