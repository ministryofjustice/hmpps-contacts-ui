import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import {
  appWithAllRoutes,
  flashProvider,
  basicPrisonUser,
  adminUser,
  authorisingUser,
} from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
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
    userSupplier: () => currentUser,
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

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('What is the contact’s date of birth? - Add a contact - DPS')
    expect($('.main-heading').first().text().trim()).toStrictEqual(
      'What is First Middle Last’s date of birth? (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/enter-name/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_DOB_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { day: '01', month: '06', year: '1982' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('01')
    expect($('#month').val()).toStrictEqual('06')
    expect($('#year').val()).toStrictEqual('1982')
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.dateOfBirth = { isKnown: 'YES', day: 1, month: 6, year: 1982 }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('1')
    expect($('#month').val()).toStrictEqual('6')
    expect($('#year').val()).toStrictEqual('1982')
  })

  it('should render submitted options on validation error even if there is a version in the session', async () => {
    // Given
    existingJourney.dateOfBirth = { isKnown: 'YES', day: 1, month: 6, year: 1982 }
    const form = { day: 'a', month: 'b', year: '1999' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#day').val()).toStrictEqual('a')
    expect($('#month').val()).toStrictEqual('b')
    expect($('#year').val()).toStrictEqual('1999')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`).expect(expectedStatus)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/enter-name', () => {
  it('should pass to next page if there are no validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ day: '', month: '', year: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)

    const expectedDob = { isKnown: 'NO' }
    expect(session.addContactJourneys![journeyId]!.dateOfBirth).toStrictEqual(expectedDob)
  })

  it.each([
    ['01', '06', '1982'],
    ['1', '6', '1982'],
  ])('should pass to next page if there are no validation errors with the date parsable', async (day, month, year) => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ day, month, year })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)

    // Then
    const expectedDob = {
      isKnown: 'YES',
      day: 1,
      month: 6,
      year: 1982,
    }
    expect(session.addContactJourneys![journeyId]!.dateOfBirth).toStrictEqual(expectedDob)
  })

  it('should pass to check answers page if a valid DOB is entered and we are checking answers', async () => {
    existingJourney.isCheckingAnswers = true
    existingJourney.dateOfBirth = { isKnown: 'YES', day: 25, month: 12, year: 1990 }

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ day: '1', month: '6', year: '1982' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedDob = {
      isKnown: 'YES',
      day: 1,
      month: 6,
      year: 1982,
    }
    expect(session.addContactJourneys![journeyId]!.dateOfBirth).toStrictEqual(expectedDob)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ day: ' ' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}#`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ day: 1, month: 1, year: 2000 })
      .expect(expectedStatus)
  })
})
