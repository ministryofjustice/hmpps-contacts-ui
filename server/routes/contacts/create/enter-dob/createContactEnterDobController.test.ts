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
    lastTouched: new Date().toISOString(),
    isCheckingAnswers: false,
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

describe('GET /contacts/create/enter-dob/:journeyId', () => {
  it('should render contact page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(response.text).toContain('Contacts')
    expect(response.text).toContain('Hmpps Contacts Ui')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_DOB_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { isKnown: 'Yes', day: '01', month: '06', year: '1982' }
    auditService.logPageView.mockResolvedValue(null)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('01')
    expect($('#month').val()).toStrictEqual('06')
    expect($('#year').val()).toStrictEqual('1982')
    expect($('input[type=radio]:checked').val()).toStrictEqual('Yes')
  })

  it('should render previously entered details if validation errors with unknown dob', async () => {
    // Given
    const form = { isKnown: 'No' }
    auditService.logPageView.mockResolvedValue(null)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toBeUndefined()
    expect($('#month').val()).toBeUndefined()
    expect($('#year').val()).toBeUndefined()
    expect($('input[type=radio]:checked').val()).toStrictEqual('No')
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.dateOfBirth = { isKnown: 'Yes', day: 1, month: 6, year: 1982 }

    // When
    const response = await request(app).get(`/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('1')
    expect($('#month').val()).toStrictEqual('6')
    expect($('#year').val()).toStrictEqual('1982')
    expect($('input[type=radio]:checked').val()).toStrictEqual('Yes')
  })

  it('should render previously entered details if no validation errors but there are session values with unknown dob', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.dateOfBirth = { isKnown: 'No' }

    // When
    const response = await request(app).get(`/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toBeUndefined()
    expect($('#month').val()).toBeUndefined()
    expect($('#year').val()).toBeUndefined()
    expect($('input[type=radio]:checked').val()).toStrictEqual('No')
  })

  it('should render submitted options on validation error even if there is a version in the session', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.dateOfBirth = { isKnown: 'Yes', day: 1, month: 6, year: 1982 }
    const form = { isKnown: 'No' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('1')
    expect($('#month').val()).toStrictEqual('6')
    expect($('#year').val()).toStrictEqual('1982')
    expect($('input[type=radio]:checked').val()).toStrictEqual('No')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/contacts/create/enter-dob/${uuidv4()}`)
      .expect(302)
      .expect('Location', '/contacts/create/start')
  })
})

describe('POST /contacts/create/enter-name', () => {
  it('should pass to success page if there are no validation errors and we created the contact with no dob', async () => {
    await request(app)
      .post(`/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ isKnown: 'false' })
      .expect(302)
      .expect('Location', `/contacts/create/check-answers/${journeyId}`)

    const expectedDob = { isKnown: 'No' }
    expect(session.createContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
  })

  it.each([
    ['01', '06', '1982'],
    ['1', '6', '1982'],
  ])(
    'should pass to check answers page if there are no validation errors with the date parsable',
    async (day, month, year) => {
      await request(app)
        .post(`/contacts/create/enter-dob/${journeyId}`)
        .type('form')
        .send({ isKnown: 'Yes', day, month, year })
        .expect(302)
        .expect('Location', `/contacts/create/check-answers/${journeyId}`)

      // Then
      const expectedDob = {
        isKnown: 'Yes',
        day: 1,
        month: 6,
        year: 1982,
      }
      expect(session.createContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/contacts/create/enter-dob/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/contacts/create/enter-dob/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', '/contacts/create/start')
  })
})
