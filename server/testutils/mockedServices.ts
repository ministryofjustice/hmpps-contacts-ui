import AuditService from '../services/auditService'
import ReferenceDataService from '../services/referenceDataService'
import PrisonerSearchService from '../services/prisonerSearchService'
import RestrictionsService from '../services/restrictionsService'
import ContactsService from '../services/contactsService'
import OrganisationsService from '../services/organisationsService'
import TelemetryService from '../services/telemetryService'
import AlertsService from '../services/alertsService'
import RestrictionsTestData from '../routes/testutils/stubRestrictionsData'
import ContactAuditHistoryService from '../services/contactAuditHistoryService'

export const MockedService = {
  // @ts-expect-error passing null param into mock service
  AuditService: () => new AuditService(null) as jest.Mocked<AuditService>,
  // @ts-expect-error passing null param into mock service
  ReferenceDataService: () => new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>,
  // @ts-expect-error passing null param into mock service
  PrisonerSearchService: () => new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>,
  // @ts-expect-error passing null param into mock service
  RestrictionsService: () => new RestrictionsService(null) as jest.Mocked<RestrictionsService>,
  ContactAuditHistoryService: (): jest.Mocked<ContactAuditHistoryService> => {
    // @ts-expect-error passing null param into mock service
    const service = new ContactAuditHistoryService(null) as jest.Mocked<ContactAuditHistoryService>
    service.getNameChangeHistory = jest.fn().mockResolvedValue([
      {
        newFirstName: 'Harry',
        newMiddleNames: 'Middle',
        newLastName: 'Eight',
        previousFirstName: 'Harry',
        previousMiddleNames: 'Middle',
        previousLastName: 'Eight',
        updatedBy: 'user1',
        changedOn: '2025-11-19T12:09:56.700724',
      },
    ])
    return service
  },

  ContactsService: (): jest.Mocked<ContactsService> => {
    // @ts-expect-error passing null param into mock service
    const service = new ContactsService(null) as jest.Mocked<ContactsService>

    // Default mock behaviour for getPrisonerRestrictions
    service.getPrisonerRestrictions = jest.fn().mockResolvedValue(RestrictionsTestData.stubRestrictionsData())

    // Add more default mocks here if needed, e.g.:
    // service.getPrisonerContact = jest.fn().mockResolvedValue(ContactTestData.stubContact())

    return service
  },
  // @ts-expect-error passing null param into mock service
  OrganisationsService: () => new OrganisationsService(null) as jest.Mocked<OrganisationsService>,
  TelemetryService: () => new TelemetryService(null) as jest.Mocked<TelemetryService>,
  AlertsService: (): jest.Mocked<AlertsService> => {
    // @ts-expect-error passing null param into mock service
    const service = new AlertsService(null) as jest.Mocked<AlertsService>

    // Example default mock
    service.getAlerts = jest.fn().mockResolvedValue({ content: [] })

    return service
  },
}
