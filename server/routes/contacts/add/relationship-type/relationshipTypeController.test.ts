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
const matchingContactId = 897654
let existingJourney: AddContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    matchingContactId,
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

describe('GET /prisoner/:prisonerNumber/contacts/create/select-relationship-type/:journeyId', () => {
  it.each([
    ['NEW', `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`, 'Add a contact and link to a prisoner'],
    [
      'EXISTING',
      `/prisoner/A1234BC/contacts/add/match/${matchingContactId}/${journeyId}`,
      'Link a contact to a prisoner',
    ],
  ])(
    'should render relationship type page for each mode %s',
    async (mode, expectedBackLink: string, expectedCaption: string) => {
      // Given
      existingJourney.mode = mode as 'NEW' | 'EXISTING'

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
      )

      // Then
      expect(response.status).toEqual(200)

      const $ = cheerio.load(response.text)
      expect($('.main-heading').first().text().trim()).toStrictEqual(
        'Is First Middle Last a social or official contact for John Smith?',
      )
      expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(expectedBackLink)
      expect($('.govuk-caption-l').first().text().trim()).toStrictEqual(expectedCaption)
      expect($('[data-qa=cancel-button]')).toHaveLength(0)
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    },
  )

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_RELATIONSHIP_TYPE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.relationship = { relationshipType: 'S' }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toStrictEqual('S')
  })

  it('should render previously entered details if no validation errors but there are pending session values', async () => {
    // Given
    existingJourney.relationship = { pendingNewRelationshipType: 'O', relationshipType: 'S' }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toStrictEqual('O')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/select-relationship-type', () => {
  it('should pass to next page with pending relationship type if there are no validation errors and we are not checking answers', async () => {
    // Given
    delete existingJourney.relationship
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)
      .type('form')
      .send({ relationshipType: 'S' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`)

    // Then
    const expectedRelationship = { pendingNewRelationshipType: 'S' }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should pass to select relationship to prisoner if we changed relationship type while we are checking answers', async () => {
    // Given
    existingJourney.relationship = {
      relationshipType: 'S',
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: false,
      isNextOfKin: true,
    }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)
      .type('form')
      .send({ relationshipType: 'O' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journeyId}`)

    // Then
    const expectedRelationship = {
      relationshipType: 'S',
      pendingNewRelationshipType: 'O',
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: false,
      isNextOfKin: true,
    }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should pass to check answers to prisoner if we selected the same relationship type while we are checking answers', async () => {
    // Given
    existingJourney.relationship = {
      relationshipType: 'S',
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: false,
      isNextOfKin: true,
    }
    existingJourney.previousAnswers = {
      relationship: {
        relationshipType: 'S',
        relationshipToPrisoner: 'MOT',
        isEmergencyContact: false,
        isNextOfKin: true,
      },
    }

    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)
      .type('form')
      .send({ relationshipType: 'S' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedRelationship = {
      relationshipType: 'S',
      pendingNewRelationshipType: 'S',
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: false,
      isNextOfKin: true,
    }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
