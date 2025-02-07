import { dataAccess } from '../data'
import AuditService from './auditService'
import PrisonerSearchService from './prisonerSearchService'
import ContactsService from './contactsService'
import PrisonerImageService from './prisonerImageService'
import ReferenceDataService from './referenceDataService'
import RestrictionsService from './restrictionsService'
import PrisonerAddressService from './prisonerAddressService'

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
  const contactsService = new ContactsService(contactsApiClient)
  const prisonerImageService = new PrisonerImageService(prisonApiClient)
  const referenceDataService = new ReferenceDataService(contactsApiClient)
  const restrictionsService = new RestrictionsService(contactsApiClient)
  const prisonerAddressService = new PrisonerAddressService(prisonApiClient)

  return {
    applicationInfo,
    auditService,
    prisonerSearchService,
    contactsService,
    prisonerImageService,
    referenceDataService,
    restrictionsService,
    prisonerAddressService,
    organisationsApiClient,
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
