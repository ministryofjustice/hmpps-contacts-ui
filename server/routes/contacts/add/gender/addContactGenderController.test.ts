import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
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
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
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
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = { ...existingJourney }
    },
  })
  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: true })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/enter-gender/:journeyId', () => {
  it('should render gender page with correct navigation before CYA', async () => {
    // Given
    existingJourney.isCheckingAnswers = false

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('What is the contact’s gender? - Add a contact - DPS')
    expect($('.main-heading').first().text().trim()).toStrictEqual('What is First Middle Last’s gender? (optional)')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
    )
    expect($('[data-qa=cancel-button]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should render gender page when checking answers', async () => {
    // Given
    existingJourney.isCheckingAnswers = true

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.main-heading').first().text().trim()).toStrictEqual('What is First Middle Last’s gender? (optional)')
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
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_ENTER_GENDER_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if there are session values', async () => {
    // Given
    existingJourney.gender = 'M'

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toStrictEqual('M')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${journeyId}`).expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/enter-gender/:journeyId', () => {
  it('should pass back to add info with a valid option before CYA', async () => {
    // Given
    delete existingJourney.gender
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${journeyId}`)
      .type('form')
      .send({ gender: 'M' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.gender).toStrictEqual('M')
  })

  it('question is optional so should be allowed to choose nothing', async () => {
    // Given
    delete existingJourney.gender
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.gender).toBeUndefined()
  })

  it('should pass to check answers if there are no validation errors and we are checking answers', async () => {
    // Given
    existingJourney.gender = 'M'
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${journeyId}`)
      .type('form')
      .send({ gender: 'F' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.gender).toStrictEqual('F')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-gender/${journeyId}`)
      .type('form')
      .send({ gender: 'F' })
      .expect(403)
  })
})
