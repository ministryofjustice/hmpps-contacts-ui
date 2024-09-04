import { dataAccess } from '../data'
import AuditService from './auditService'
import PrisonerSearchService from './prisonerSearchService'
import ContactsService from './contactsService'
import PrisonerImageService from './prisonerImageService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, prisonerSearchApiClient, contactsApiClient, prisonApiClient } =
    dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)
  const contactsService = new ContactsService(contactsApiClient)
  const prisonerImageService = new PrisonerImageService(prisonApiClient)

  return {
    applicationInfo,
    auditService,
    prisonerSearchService,
    contactsService,
    prisonerImageService,
  }
}

export type Services = ReturnType<typeof services>

export { AuditService, PrisonerSearchService, ContactsService, PrisonerImageService }
