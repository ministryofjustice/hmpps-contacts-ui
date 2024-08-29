import { dataAccess } from '../data'
import AuditService from './auditService'
import PrisonerSearchService from './prisonerSearchService'
import ContactsService from './contactsService'

export const services = () => {
  const {
    applicationInfo,
    hmppsAuditClient,
    prisonerSearchApiClient,
    contactsApiClient,
  } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)
  const contactsService = new ContactsService(contactsApiClient)

  return {
    applicationInfo,
    auditService,
    prisonerSearchService,
    contactsService,
  }
}

export type Services = ReturnType<typeof services>

export { AuditService, PrisonerSearchService, ContactsService }
