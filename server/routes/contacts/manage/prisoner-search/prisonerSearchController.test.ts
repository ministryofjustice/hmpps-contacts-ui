import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, flashProvider, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import { ENTER_TWO_CHARS_MIN } from './prisonerSearchSchema'
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')

const auditService = MockedService.AuditService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.manageContactsJourneys = {}
      session.manageContactsJourneys[journeyId] = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
      }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/prisoner-search', () => {
  it('should render the search page', async () => {
    const response = await request(app).get(`/contacts/manage/prisoner-search/${journeyId}`)

    expect(response.status).toEqual(200)
    expect(response.text).toContain('Contacts')
    expect(response.text).toContain('Hmpps Contacts Ui')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.PRISONER_SEARCH_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should return to start if the journey ID is not recognised in the session', async () => {
    await request(app)
      .get(`/contacts/manage/prisoner-search/${uuidv4()}`)
      .expect(302)
      .expect('Location', '/contacts/manage/start')
  })
})

describe('POST /contacts/manage/prisoner-search/:journeyId', () => {
  it('should forward to the results page if there are no validation errors', async () => {
    flashProvider.mockReturnValue({ search: ['A1111AA'] })

    await request(app)
      .post(`/contacts/manage/prisoner-search/${journeyId}`)
      .type('form')
      .send({ search: 'A1111AA' })
      .expect(302)
      .expect('Location', `/contacts/manage/prisoner-search-results/${journeyId}`)

    expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.any(String))
    expect(session.manageContactsJourneys![journeyId]!.search!.searchTerm).toEqual('A1111AA')
  })

  it('should return to search entry page if there are validation errors', async () => {
    flashProvider.mockReturnValue({ search: [ENTER_TWO_CHARS_MIN] })

    await request(app)
      .post(`/contacts/manage/prisoner-search/${journeyId}`)
      .type('form')
      .send({ search: 'A' })
      .expect(302)
      .expect('Location', `/contacts/manage/prisoner-search/${journeyId}`)

    expect(flashProvider).toHaveBeenCalledWith('validationErrors', `{"search":["${ENTER_TWO_CHARS_MIN}"]}`)
  })

  it('should return to the start if no matching journey in session', async () => {
    await request(app)
      .post(`/contacts/manage/prisoner-search/${uuidv4()}`)
      .type('form')
      .send({ search: 'Any' })
      .expect(302)
      .expect('Location', '/contacts/manage/start')
  })
})
