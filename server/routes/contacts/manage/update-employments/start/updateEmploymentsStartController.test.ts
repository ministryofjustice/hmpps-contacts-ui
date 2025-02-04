import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../../../../testutils/appSetup'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { components } from '../../../../../@types/contactsApi'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const prisoner = TestData.prisoner()
let session: Partial<SessionData>

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/update-employments', () => {
  it('should start journey and populate contact data into session, then redirect to entry page', async () => {
    // Given
    const employment: components['schemas']['EmploymentDetails'] = {
      employmentId: 0,
      contactId: 0,
      employer: {
        organisationId: 0,
        organisationName: 'Big Corp',
        organisationActive: true,
        businessPhoneNumber: '60511',
        businessPhoneNumberExtension: '123',
        property: 'Some House',
        countryDescription: 'England',
      },
      isActive: false,
      createdBy: '',
      createdTime: '',
    }
    const contact = TestData.contact({ employments: [employment] })

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/update-employments?returnUrl=/foo/bar`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(/contacts\/manage\/1\/update-employments\/[a-f0-9-]{36}/)
    const responseJourneyId = response.headers['location']!.split('/').slice(-1)[0]
    const journeyData = session.updateEmploymentsJourneys![responseJourneyId!]!

    expect(journeyData.contactId).toEqual(contact.id)
    expect(journeyData.contactNames!.firstName).toEqual(contact.firstName)
    expect(journeyData.contactNames!.middleNames).toEqual(contact.middleNames)
    expect(journeyData.contactNames!.lastName).toEqual(contact.lastName)
    expect(journeyData.contactNames!.title).toEqual(contact.title)
    expect(journeyData.employments[0]).toEqual(employment)
    expect(journeyData.returnPoint!.url).toEqual('/foo/bar')
  })
})
