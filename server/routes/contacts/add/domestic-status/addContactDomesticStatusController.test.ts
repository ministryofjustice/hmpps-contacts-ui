import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, basicPrisonUser } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../@types/journeys'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/referenceDataService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()

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
    relationship: {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: true,
      isNextOfKin: true,
    },
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
    },
    userSupplier: () => basicPrisonUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/domestic-status/:journeyId', () => {
  it('should render page with correct navigation before CYA', async () => {
    // Given
    existingJourney.isCheckingAnswers = false

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/domestic-status/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('What is the contact’s domestic status? - Add a contact - DPS')
    expect($('.main-heading').first().text().trim()).toStrictEqual(
      'What is First Middle Last’s domestic status? (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render page when checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = true

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/domestic-status/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.main-heading').first().text().trim()).toStrictEqual(
      'What is First Middle Last’s domestic status? (optional)',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/domestic-status/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE, {
      who: basicPrisonUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if there are session values', async () => {
    // Given
    existingJourney.domesticStatusCode = 'S'

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/domestic-status/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toStrictEqual('S')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/domestic-status/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/domestic-status/:journeyId', () => {
  it('should pass back to add info with a valid option before CYA', async () => {
    // Given
    delete existingJourney.domesticStatusCode
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/domestic-status/${journeyId}`)
      .type('form')
      .send({ domesticStatusCode: 'S' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.domesticStatusCode).toStrictEqual('S')
  })

  it('question is optional so should be allowed to choose nothing', async () => {
    // Given
    delete existingJourney.domesticStatusCode
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/domestic-status/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.domesticStatusCode).toBeUndefined()
  })

  it('should pass to check answers if there are no validation errors and we are checking answers', async () => {
    // Given
    existingJourney.domesticStatusCode = 'S'
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/domestic-status/${journeyId}`)
      .type('form')
      .send({ domesticStatusCode: 'M' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.domesticStatusCode).toStrictEqual('M')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/domestic-status/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
