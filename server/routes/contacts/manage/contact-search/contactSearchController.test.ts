import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CreateContactJourney = journeys.CreateContactJourney

jest.mock('../../../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: CreateContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
  }
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.manageContactsJourneys = {}
      session.manageContactsJourneys[journeyId] = existingJourney
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/start', () => {
  it('should render contact page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${journeyId}/contacts/create/start`)
    const $ = cheerio.load(response.text)

    // Then
    // expect(response.status).toEqual(200)
    // expect($('h1.govuk-heading-l').text()).toContain('Search for Contact')
    // expect($('input#firstName')).toBeDefined()
    // expect($('input#middleName')).toBeDefined()
    // expect($('input#lastName')).toBeDefined()
    // expect($('input#day')).toBeDefined()
    // expect($('input#month')).toBeDefined()
    // expect($('input#year')).toBeDefined()

    // expect($('govuk-label').eq(0).text()).toContain('First name')

    // expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_SEARCH_PAGE, {
    //   who: user.username,
    //   correlationId: expect.any(String),
    // })
  })
})
