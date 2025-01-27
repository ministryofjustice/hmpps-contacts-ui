import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import AddContactJourney = journeys.AddContactJourney
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

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
      isEmergencyContact: 'YES',
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

describe('GET /prisoner/:prisonerNumber/contacts/create/select-next-of-kin/:journeyId', () => {
  it.each([
    ['NEW', 'Add a contact and link to a prisoner'],
    ['EXISTING', 'Link a contact to a prisoner'],
  ])('should render enter next of kin page for each mode %s', async (mode, expectedCaption: string) => {
    // Given
    existingJourney.mode = mode as 'NEW' | 'EXISTING'

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Is First Middle Last next of kin for the prisoner?',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual(expectedCaption)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given

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
    existingJourney.relationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: 'NO', isNextOfKin: 'YES' }

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
    existingJourney.relationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: 'NO' }
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`)
      .type('form')
      .send({ isNextOfKin: 'YES' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)

    // Then
    const expectedRelationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: 'NO', isNextOfKin: 'YES' }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should pass to check answers if there are no validation errors and we are checking answers', async () => {
    // Given
    existingJourney.relationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: 'NO' }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`)
      .type('form')
      .send({ isNextOfKin: 'YES' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedRelationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: 'NO', isNextOfKin: 'YES' }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
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
