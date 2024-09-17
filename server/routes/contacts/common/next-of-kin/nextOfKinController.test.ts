import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CreateContactJourney = journeys.CreateContactJourney
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import TestData from '../../../testutils/testData'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>

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
    relationship: {
      type: 'MOT',
      isEmergencyContact: 'YES',
    },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.createContactJourneys = {}
      session.createContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/select-next-of-kin/:journeyId', () => {
  it('should render enter next of kin page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Is last, first next of kin for the prisoner?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=contact-list-breadcrumb-link]').first().attr('href')).toStrictEqual('/foo-bar')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_NEXT_OF_KIN, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.relationship = { type: 'MOT', isEmergencyContact: 'NO', isNextOfKin: 'YES' }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toStrictEqual('YES')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/select-next-of-kin', () => {
  it('should pass to next page if there are no validation errors and we are not checking answers', async () => {
    // Given
    existingJourney.relationship = { type: 'MOT', isEmergencyContact: 'NO' }
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`)
      .type('form')
      .send({ isNextOfKin: 'YES' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)

    // Then
    const expectedRelationship = { type: 'MOT', isEmergencyContact: 'NO', isNextOfKin: 'YES' }
    expect(session.createContactJourneys[journeyId].relationship).toStrictEqual(expectedRelationship)
  })

  it('should pass to check answers if there are no validation errors and we are checking answers', async () => {
    // Given
    existingJourney.relationship = { type: 'MOT', isEmergencyContact: 'NO' }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`)
      .type('form')
      .send({ isNextOfKin: 'YES' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedRelationship = { type: 'MOT', isEmergencyContact: 'NO', isNextOfKin: 'YES' }
    expect(session.createContactJourneys[journeyId].relationship).toStrictEqual(expectedRelationship)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
