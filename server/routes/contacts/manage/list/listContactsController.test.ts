import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary
import TestData from '../../../testutils/testData'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.manageContactsJourneys = {}
      session.manageContactsJourneys[journeyId] = {
        id: journeyId,
        lastTouched: new Date(),
        search: {
          searchTerm: 'A4162DZ',
        },
        prisoner: {
          prisonerNumber: 'A4162DZ',
          firstName: 'Jon',
          lastName: 'Harper',
          dateOfBirth: '1 Aug 1974',
          prisonId: 'MDI',
          prisonName: 'Moorland HMP',
        },
      }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/list', () => {
  it('should render the contacts list for a prisoner', async () => {
    auditService.logPageView.mockResolvedValue(null)
    const contactsList: PrisonerContactSummary = [
      {
        prisonerContactId: 100,
        contactId: 200,
        prisonerNumber: 'G9381UV',
        surname: 'Adams',
        forename: 'Claire',
        middleName: '',
        dateOfBirth: new Date('1973-01-10'),
        relationshipCode: 'code here',
        relationshipDescription: 'Friend',
        flat: 'FLAT 1',
        property: 'Proeperty',
        street: '123 High Street',
        area: 'Mayfair',
        cityCode: 'London',
        countyCode: 'county code here',
        postCode: 'W1 1AA',
        countryCode: 'England',
        approvedVisitor: true,
        nextOfKin: true,
        emergencyContact: true,
        awareOfCharges: true,
        comments: 'comments here',
      },
    ]

    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getPrisonerContacts.mockReturnValue(contactsList)

    const response = await request(app).get(`/contacts/manage/list/${journeyId}`)

    // Prisoner
    expect(response.status).toEqual(200)
    expect(response.text).toContain('John')
    expect(response.text).toContain('Smith')
    expect(response.text).toContain('2 April 1975')
    expect(response.text).toContain('HMP Hewell')
    expect(response.text).toContain('1-1-C-028')

    // Button
    expect(response.text).toContain('Add prisoner contact')

    // Contact List Table
    expect(response.text).toContain('Contacts')
    expect(response.text).toContain('Name')
    expect(response.text).toContain('Date of birth')
    expect(response.text).toContain('Address')
    expect(response.text).toContain('Relationship to prisoner')
    expect(response.text).toContain('Emergency contact')
    expect(response.text).toContain('Next of kin')
    expect(response.text).toContain('Approved')

    expect(response.text).toContain('Adams, Claire')
    expect(response.text).toContain('10 January 1973')
    expect(response.text).toContain('(52 years old)')
    expect(response.text).toContain('FLAT 1')
    expect(response.text).toContain('123 High Street')
    expect(response.text).toContain('Mayfair')
    expect(response.text).toContain('London')
    expect(response.text).toContain('W1 1AA')
    expect(response.text).toContain('London')
    expect(response.text).toContain('England')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.LIST_CONTACTS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render a message that the prisoner does not have any active/inactive contacts', async () => {
    auditService.logPageView.mockResolvedValue(null)
    const contactsList: PrisonerContactSummary = []

    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getPrisonerContacts.mockReturnValue(contactsList)

    const response = await request(app).get(`/contacts/manage/list/${journeyId}`)

    expect(response.text).toContain('John Smith does not have any active contacts')
    expect(response.text).toContain('John Smith does not have any inactive contacts')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.LIST_CONTACTS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should return to start if the journey ID is not recognised in the session', async () => {
    await request(app)
      .get(`/contacts/manage/list/${uuidv4()}?prisoner=A462DZ`)
      .expect(302)
      .expect('Location', '/contacts/manage/start')
  })
})
