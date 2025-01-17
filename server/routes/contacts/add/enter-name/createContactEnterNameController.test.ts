import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import ReferenceDataService from '../../../../services/referenceDataService'
import { mockedReferenceData, STUBBED_TITLE_OPTIONS } from '../../../testutils/stubReferenceData'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import TestData from '../../../testutils/testData'
import AddContactJourney = journeys.AddContactJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
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
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
    },
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/enter-name', () => {
  it('should render enter name page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual("What is the contact's name?")
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('title options are ordered alphabetically', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('#title :nth-child(1)').text()).toStrictEqual('')
    expect($('#title :nth-child(2)').text()).toStrictEqual('Brother')
    expect($(`#title :nth-child(${STUBBED_TITLE_OPTIONS.length + 1})`).text()).toStrictEqual('Sister')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_NAME_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { firstName: 'first', lastName: 'last', middleNames: 'middle', title: 'MR' }
    auditService.logPageView.mockResolvedValue(null)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first')
    expect($('#middleNames').val()).toStrictEqual('middle')
    expect($('#lastName').val()).toStrictEqual('last')
    expect($('#title').val()).toStrictEqual('MR')
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.names = { firstName: 'first', lastName: 'last', middleNames: 'middle', title: 'MR' }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first')
    expect($('#middleNames').val()).toStrictEqual('middle')
    expect($('#lastName').val()).toStrictEqual('last')
    expect($('#title').val()).toStrictEqual('MR')
  })

  it('should render submitted options on validation error even if there is a version in the session', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.names = { firstName: 'first', lastName: 'last', middleNames: 'middle', title: 'MR' }
    const form = { firstName: 'first updated', lastName: 'last updated', middleNames: 'middle updated', title: 'DR' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first updated')
    expect($('#middleNames').val()).toStrictEqual('middle updated')
    expect($('#lastName').val()).toStrictEqual('last updated')
    expect($('#title').val()).toStrictEqual('DR')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/enter-name/:journeyId', () => {
  it('should pass to relationship type page if there are no validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first', lastName: 'last', middleNames: 'middle', title: 'Mr' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)

    expect(session.addContactJourneys[journeyId].names).toStrictEqual({
      lastName: 'last',
      firstName: 'first',
      middleNames: 'middle',
      title: 'Mr',
    })
  })

  it('should pass to check answers page if there are no validation errors and journey is in check state', async () => {
    // Given
    existingJourney.names = {
      lastName: 'last',
      firstName: 'first',
      middleNames: 'middle',
      title: 'MR',
    }
    existingJourney.isCheckingAnswers = true

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first updated', lastName: 'last updated', middleNames: 'middle updated', title: 'DR' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys[journeyId].names).toStrictEqual({
      lastName: 'last updated',
      firstName: 'first updated',
      middleNames: 'middle updated',
      title: 'DR',
    })
  })

  it('should return to enter page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)
      .type('form')
      .send({ firstName: 'first' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-name/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-name/${uuidv4()}`)
      .type('form')
      .send({ firstName: 'first' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
