import { dataAccess } from '../data'
import AuditService from './auditService'
import PrisonerSearchService from './prisonerSearchService'
import ContactsService from './contactsService'
import PrisonerImageService from './prisonerImageService'
import ReferenceDataService from './referenceDataService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, prisonerSearchApiClient, contactsApiClient, prisonApiClient } =
    dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)
  const contactsService = new ContactsService(contactsApiClient)
  const prisonerImageService = new PrisonerImageService(prisonApiClient)
  const referenceDataService = new ReferenceDataService(contactsApiClient)

  return {
    applicationInfo,
    auditService,
    prisonerSearchService,
    contactsService,
    prisonerImageService,
    referenceDataService,
  }
}

export type Services = ReturnType<typeof services>

export { AuditService, PrisonerSearchService, ContactsService, PrisonerImageService }
