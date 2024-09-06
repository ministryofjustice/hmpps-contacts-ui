import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'

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
        lastTouched: new Date().toISOString(),
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

    // TODO: Tim
    // prisonerSearchService mock result
    // contactsService mock result

    const response = await request(app).get(`/contacts/manage/list/${journeyId}`)

    expect(response.status).toEqual(200)
    expect(response.text).toContain('Contacts')

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
