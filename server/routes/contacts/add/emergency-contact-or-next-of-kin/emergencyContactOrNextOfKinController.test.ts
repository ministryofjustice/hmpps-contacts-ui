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

describe('GET /prisoner/:prisonerNumber/contacts/create/emergency-contact-or-next-of-kin/:journeyId', () => {
  it.each([
    ['NEW', 'Add a contact and link to a prisoner', 'Add a contact - DPS'],
    ['EXISTING', 'Link a contact to a prisoner', 'Link a contact to a prisoner - DPS'],
  ])(
    'should render emergency contact or next of kin page for each mode %s',
    async (mode, expectedCaption: string, titleSuffix) => {
      // Given
      existingJourney.mode = mode as 'NEW' | 'EXISTING'

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('title').text()).toStrictEqual(
        `Is this person an emergency contact or next of kin for the prisoner? - ${titleSuffix}`,
      )
      expect($('.main-heading').first().text().trim()).toStrictEqual(
        'Is First Middle Last an emergency contact or next of kin for John Smith? (optional)',
      )
      expect($('.govuk-caption-l').first().text().trim()).toStrictEqual(expectedCaption)
      expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
      expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
      expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
        `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
      )
      expect($('[data-qa=cancel-button]')).toHaveLength(0)
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)

      expect($('input[type=radio]:checked').val()).toBeUndefined()
    },
  )

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.relationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: false, isNextOfKin: true }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toStrictEqual('NOK')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/emergency-contact-or-next-of-kin', () => {
  it('should pass to next page if there are no validation errors and we are not checking answers', async () => {
    // Given
    existingJourney.relationship = { relationshipToPrisoner: 'MOT' }
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`)
      .type('form')
      .send({ isEmergencyContactOrNextOfKin: 'NOK' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`)

    // Then
    const expectedRelationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: false, isNextOfKin: true }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should pass to check answers if there are no validation errors and we are checking answers', async () => {
    // Given
    existingJourney.relationship = { relationshipToPrisoner: 'MOT' }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`)
      .type('form')
      .send({ isEmergencyContactOrNextOfKin: 'NOK' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedRelationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: false, isNextOfKin: true }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should accept blank input', async () => {
    // Given
    existingJourney.relationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: true, isNextOfKin: false }

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/approved-to-visit/${journeyId}`)

    // Then
    const expectedRelationship = {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: undefined,
      isNextOfKin: undefined,
    }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
