import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import ContactService from '../../../../../services/contactsService'
import TestData from '../../../../testutils/testData'
import GetContactResponse = contactsApiClientTypes.GetContactResponse

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactService(null) as jest.Mocked<ContactService>

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 987654
const contact: GetContactResponse = {
  id: contactId,
  title: '',
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  identities: [
    TestData.getContactIdentityDetails('DL', 'Driving licence', 'LAST-87736799M', 'UK', 1, true),
    TestData.getContactIdentityDetails(
      'PASS',
      'Passport number',
      '425362965',
      'Issuing authorithy - UK passport office',
      2,
      true,
    ),
    TestData.getContactIdentityDetails('NINO', 'National insurance number', '06/614465M', 'UK', 3, true),
  ],
  createdBy: user.username,
  createdTime: '2024-01-01',
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/delete', () => {
  it('should delete contact and redirect back to manage contact', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/1/delete`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    // Then
    expect(contactsService.deleteContactIdentity).toHaveBeenCalledWith(contactId, 1, user)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/1/delete`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_DELETE_IDENTITY_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should raise an error if the contact identity number is missing', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/555/delete`,
    )

    // Then
    expect(response.status).toEqual(500)
  })
})
