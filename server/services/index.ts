import { dataAccess } from '../data'
import AuditService from './auditService'
import PrisonerSearchService from './prisonerSearchService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, hmppsAuthClient, prisonerSearchApiClientBuilder } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClientBuilder, hmppsAuthClient)

  return {
    applicationInfo,
    auditService,
    prisonerSearchService,
  }
}

export type Services = ReturnType<typeof services>

export { AuditService, PrisonerSearchService }
