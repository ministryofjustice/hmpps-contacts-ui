import { dataAccess } from '../data'
import AuditService from './auditService'
import PrisonerSearchService from './prisonerSearchService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, hmppsAuthClient, prisonerSearchClientBuilder } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, hmppsAuthClient)

  return {
    applicationInfo,
    auditService,
    prisonerSearchService,
  }
}

export type Services = ReturnType<typeof services>

export { AuditService, PrisonerSearchService }
