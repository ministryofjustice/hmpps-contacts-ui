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
import { ContactsApiClient, HmppsAuditClient, OrganisationsApiClient, PrisonerSearchApiClient } from '../data'
import AlertsApiClient from '../data/alertsApiClient'

export const MockedService = {
  AuditService: () => new AuditService({} as HmppsAuditClient) as jest.Mocked<AuditService>,
  ReferenceDataService: () => new ReferenceDataService({} as ContactsApiClient) as jest.Mocked<ReferenceDataService>,
  PrisonerSearchService: () =>
    new PrisonerSearchService({} as PrisonerSearchApiClient) as jest.Mocked<PrisonerSearchService>,
  RestrictionsService: () =>
    new RestrictionsService({} as ContactsApiClient, {} as AuditService) as jest.Mocked<RestrictionsService>,
  ContactAuditHistoryService: (): jest.Mocked<ContactAuditHistoryService> => {
    const service = new ContactAuditHistoryService({} as ContactsApiClient) as jest.Mocked<ContactAuditHistoryService>
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
    const service = new ContactsService(
      {} as ContactsApiClient,
      {} as AuditService,
      {} as TelemetryService,
    ) as jest.Mocked<ContactsService>

    // Default mock behaviour for getPrisonerRestrictions
    service.getPrisonerRestrictions = jest.fn().mockResolvedValue(RestrictionsTestData.stubRestrictionsData())

    // Add more default mocks here if needed, e.g.:
    // service.getPrisonerContact = jest.fn().mockResolvedValue(ContactTestData.stubContact())

    return service
  },
  OrganisationsService: () =>
    new OrganisationsService({} as OrganisationsApiClient) as jest.Mocked<OrganisationsService>,
  TelemetryService: () => new TelemetryService(null) as jest.Mocked<TelemetryService>,
  AlertsService: (): jest.Mocked<AlertsService> => {
    const service = new AlertsService({} as AlertsApiClient, {} as AuditService) as jest.Mocked<AlertsService>

    // Example default mock
    service.getAlerts = jest.fn().mockResolvedValue({ content: [] })

    return service
  },
}
