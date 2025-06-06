import AuditService from '../services/auditService'
import ReferenceDataService from '../services/referenceDataService'
import PrisonerSearchService from '../services/prisonerSearchService'
import RestrictionsService from '../services/restrictionsService'
import ContactsService from '../services/contactsService'
import OrganisationsService from '../services/organisationsService'
import TelemetryService from '../services/telemetryService'

export const MockedService = {
  // @ts-expect-error passing null param into mock service
  AuditService: () => new AuditService(null) as jest.Mocked<AuditService>,
  // @ts-expect-error passing null param into mock service
  ReferenceDataService: () => new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>,
  // @ts-expect-error passing null param into mock service
  PrisonerSearchService: () => new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>,
  // @ts-expect-error passing null param into mock service
  RestrictionsService: () => new RestrictionsService(null) as jest.Mocked<RestrictionsService>,
  // @ts-expect-error passing null param into mock service
  ContactsService: () => new ContactsService(null) as jest.Mocked<ContactsService>,
  // @ts-expect-error passing null param into mock service
  OrganisationsService: () => new OrganisationsService(null) as jest.Mocked<OrganisationsService>,
  TelemetryService: () => new TelemetryService(null) as jest.Mocked<TelemetryService>,
}
