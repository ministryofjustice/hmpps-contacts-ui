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
let existingJourney: CreateContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date(),
    isCheckingAnswers: false,
  }
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.createContactJourneys = {}
      session.createContactJourneys[journeyId] = existingJourney
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/create/enter-name', () => {
  it('should render contact page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(response.text).toContain('Contacts')
    expect(response.text).toContain('Hmpps Contacts Ui')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_NAME_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { firstName: 'first', lastName: 'last', middleName: 'middle', title: 'MR' }
    auditService.logPageView.mockResolvedValue(null)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first')
    expect($('#middleName').val()).toStrictEqual('middle')
    expect($('#lastName').val()).toStrictEqual('last')
    expect($('#title').val()).toStrictEqual('MR')
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.names = { firstName: 'first', lastName: 'last', middleName: 'middle', title: 'MR' }

    // When
    const response = await request(app).get(`/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first')
    expect($('#middleName').val()).toStrictEqual('middle')
    expect($('#lastName').val()).toStrictEqual('last')
    expect($('#title').val()).toStrictEqual('MR')
  })
  it('should render submitted options on validation error even if there is a version in the session', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.names = { firstName: 'first', lastName: 'last', middleName: 'middle', title: 'MR' }
    const form = { firstName: 'first updated', lastName: 'last updated', middleName: 'middle updated', title: 'DR' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first updated')
    expect($('#middleName').val()).toStrictEqual('middle updated')
    expect($('#lastName').val()).toStrictEqual('last updated')
    expect($('#title').val()).toStrictEqual('DR')
  })
  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/contacts/create/enter-name/${uuidv4()}`)
      .expect(302)
      .expect('Location', '/contacts/create/start')
  })
})

describe('POST /contacts/create/enter-name/:journeyId', () => {
  it('should pass to success page if there are no validation errors', async () => {
    await request(app)
      .post(`/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first', lastName: 'last', middleName: 'middle', title: 'Mr' })
      .expect(302)
      .expect('Location', `/contacts/create/enter-dob/${journeyId}`)

    expect(session.createContactJourneys[journeyId].names).toStrictEqual({
      lastName: 'last',
      firstName: 'first',
      middleName: 'middle',
      title: 'Mr',
    })
  })

  it('should pass to check answers page if there are no validation errors and journey is in check state', async () => {
    // Given
    existingJourney.names = {
      lastName: 'last',
      firstName: 'first',
      middleName: 'middle',
      title: 'MR',
    }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first updated', lastName: 'last updated', middleName: 'middle updated', title: 'DR' })
      .expect(302)
      .expect('Location', `/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.createContactJourneys[journeyId].names).toStrictEqual({
      lastName: 'last updated',
      firstName: 'first updated',
      middleName: 'middle updated',
      title: 'DR',
    })
  })

  it('should return to enter page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first' })
      .expect(302)
      .expect('Location', `/contacts/create/enter-name/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/contacts/create/enter-name/${uuidv4()}`)
      .type('form')
      .send({ firstName: 'first' })
      .expect(302)
      .expect('Location', '/contacts/create/start')
  })
})
