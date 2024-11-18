import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import AddContactJourney = journeys.AddContactJourney
import TestData from '../../../testutils/testData'
import PrisonerSearchService from '../../../../services/prisonerSearchService'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { url: '/foo-bar' },
    names: {
      lastName: 'last',
      middleNames: 'middle',
      firstName: 'first',
    },
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/enter-dob/:journeyId', () => {
  it('should render enter dob page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      "Do you know First Middle Last's date of birth?",
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_DOB_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { isKnown: 'YES', day: '01', month: '06', year: '1982' }
    auditService.logPageView.mockResolvedValue(null)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('01')
    expect($('#month').val()).toStrictEqual('06')
    expect($('#year').val()).toStrictEqual('1982')
    expect($('input[type=radio]:checked').val()).toStrictEqual('YES')
  })

  it('should render previously entered details if validation errors with unknown dob', async () => {
    // Given
    const form = { isKnown: 'NO' }
    auditService.logPageView.mockResolvedValue(null)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toBeUndefined()
    expect($('#month').val()).toBeUndefined()
    expect($('#year').val()).toBeUndefined()
    expect($('input[type=radio]:checked').val()).toStrictEqual('NO')
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.dateOfBirth = { isKnown: 'YES', day: 1, month: 6, year: 1982 }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('1')
    expect($('#month').val()).toStrictEqual('6')
    expect($('#year').val()).toStrictEqual('1982')
    expect($('input[type=radio]:checked').val()).toStrictEqual('YES')
  })

  it('should render previously entered details if no validation errors but there are session values with unknown dob', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.dateOfBirth = { isKnown: 'NO' }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toBeUndefined()
    expect($('#month').val()).toBeUndefined()
    expect($('#year').val()).toBeUndefined()
    expect($('input[type=radio]:checked').val()).toStrictEqual('NO')
  })

  it('should render submitted options on validation error even if there is a version in the session', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.dateOfBirth = { isKnown: 'YES', day: 1, month: 6, year: 1982 }
    const form = { isKnown: 'NO' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('1')
    expect($('#month').val()).toStrictEqual('6')
    expect($('#year').val()).toStrictEqual('1982')
    expect($('input[type=radio]:checked').val()).toStrictEqual('NO')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/enter-name', () => {
  it('should pass to enter estimated dob page if there are no validation errors and we created the contact with no dob', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ isKnown: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${journeyId}`)

    const expectedDob = { isKnown: 'NO' }
    expect(session.addContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
  })

  it.each([
    ['01', '06', '1982'],
    ['1', '6', '1982'],
  ])(
    'should pass to relationship comments page if there are no validation errors with the date parsable',
    async (day, month, year) => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
        .type('form')
        .send({ isKnown: 'YES', day, month, year })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)

      // Then
      const expectedDob = {
        isKnown: 'YES',
        day: 1,
        month: 6,
        year: 1982,
      }
      expect(session.addContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
    },
  )

  it('should pass to check answers page if a valid DOB is entered and we are checking answers', async () => {
    existingJourney.isCheckingAnswers = true
    existingJourney.dateOfBirth = { isKnown: 'YES', day: 25, month: 12, year: 1990 }

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ isKnown: 'YES', day: '1', month: '6', year: '1982' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedDob = {
      isKnown: 'YES',
      day: 1,
      month: 6,
      year: 1982,
    }
    expect(session.addContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
  })

  it('should pass to estimated DOB page if no DOB is entered even if we are checking answers and a DOB was previously entered', async () => {
    existingJourney.isCheckingAnswers = true
    existingJourney.dateOfBirth = { isKnown: 'YES', day: 25, month: 12, year: 1990 }

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ isKnown: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${journeyId}`)

    // Then
    const expectedDob = { isKnown: 'NO' }
    expect(session.addContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
  })

  it('should keep estimated DOB if we are checking answers and choose NO again', async () => {
    existingJourney.isCheckingAnswers = true
    existingJourney.dateOfBirth = { isKnown: 'NO', isOverEighteen: 'YES' }

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ isKnown: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-estimated-dob/${journeyId}`)

    // Then
    const expectedDob = { isKnown: 'NO', isOverEighteen: 'YES' }
    expect(session.addContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
