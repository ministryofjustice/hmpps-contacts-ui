import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import TestData from '../../../../testutils/testData'
import UpdateDateOfBirthJourney = journeys.UpdateDateOfBirthJourney

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const contactId = 99
const prisonerNumber = 'A1234BC'
let existingJourney: UpdateDateOfBirthJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    contactId,
    prisonerNumber,
    returnPoint: { type: 'MANAGE_CONTACT_RELATIONSHIP', url: '/foo-bar' },
    names: {
      lastName: 'last',
      firstName: 'first',
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
      session.updateDateOfBirthJourneys = {}
      session.updateDateOfBirthJourneys[journeyId] = { ...existingJourney }
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/enter-estimated-dob/:journeyId', () => {
  it('should render enter estimated dob page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/enter-estimated-dob/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Is Last, First over 18 years old?')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/enter-estimated-dob/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_DOB_ESTIMATED_DOB_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/enter-estimated-dob/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/enter-estimated-dob/:journeyId', () => {
  it('should pass to complete update endpoint if there are no validation errors', async () => {
    // Given
    existingJourney.dateOfBirth = { isKnown: 'NO' }

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/enter-estimated-dob/${journeyId}`)
      .type('form')
      .send({ isOverEighteen: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/complete/${journeyId}`)

    // Then
    const expectedDob = { isKnown: 'NO', isOverEighteen: 'NO' }
    expect(session.updateDateOfBirthJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/enter-estimated-dob/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/enter-estimated-dob/${journeyId}`,
      )
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/enter-estimated-dob/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/start`)
  })
})
