import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
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
    returnPoint: { type: 'MANAGE_PRISONER_CONTACTS', url: '/foo-bar' },
    names: {
      lastName: 'last',
      firstName: 'first',
    },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.createContactJourneys = {}
      session.createContactJourneys[journeyId] = { ...existingJourney }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/enter-estimated-dob/:journeyId', () => {
  it('should render enter estimated dob page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Is last, first over 18 years old?')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=contact-list-breadcrumb-link]').first().attr('href')).toStrictEqual('/foo-bar')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.dateOfBirth = { isKnown: 'NO', isOverEighteen: 'YES' }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toStrictEqual('YES')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/enter-estimated-dob', () => {
  it('should pass to success page if there are no validation errors', async () => {
    // Given
    existingJourney.dateOfBirth = { isKnown: 'NO' }

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${journeyId}`)
      .type('form')
      .send({ isOverEighteen: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedDob = { isKnown: 'NO', isOverEighteen: 'NO' }
    expect(session.createContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
