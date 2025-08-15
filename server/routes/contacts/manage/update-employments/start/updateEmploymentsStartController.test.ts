import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { adminUser, appWithAllRoutes } from '../../../../testutils/appSetup'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { EmploymentDetails } from '../../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
import mockPermissions from '../../../../testutils/mockPermissions'
import Permission from '../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
let currentUser: HmppsUser
const prisonerNumber = 'A1234BC'
const prisoner = TestData.prisoner()
let session: Partial<SessionData>

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
    },
    userSupplier: () => currentUser,
  })

  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: true })

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/update-employments', () => {
  it('should start journey and populate contact data into session, then redirect to entry page', async () => {
    // Given
    const employment: EmploymentDetails = {
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
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toMatch(
      /contacts\/manage\/1\/relationship\/2\/update-employments\/[a-f0-9-]{36}/,
    )
    const responseJourneyId = response.headers['location']!.split('/').slice(-1)[0]
    const journeyData = session.updateEmploymentsJourneys![responseJourneyId!]!

    expect(journeyData.contactId).toEqual(contact.id)
    expect(journeyData.contactNames!.firstName).toEqual(contact.firstName)
    expect(journeyData.contactNames!.middleNames).toEqual(contact.middleNames)
    expect(journeyData.contactNames!.lastName).toEqual(contact.lastName)
    expect(journeyData.contactNames!.title).toEqual(contact.titleCode)
    expect(journeyData.employments[0]).toEqual(employment)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContact.mockResolvedValue(TestData.contact())

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2/update-employments`)
      .expect(403)
  })
})
