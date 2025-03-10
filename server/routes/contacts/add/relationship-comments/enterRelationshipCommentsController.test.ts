import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../testutils/appSetup'
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
      middleNames: 'Middle',
      firstName: 'first',
    },
    dateOfBirth: {
      isKnown: 'NO',
    },
    relationship: {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: 'YES',
      isNextOfKin: 'YES',
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

describe('GET /prisoner/:prisonerNumber/contacts/create/enter-relationship-comments/:journeyId', () => {
  it.each([
    ['NEW', 'Add a contact and link to a prisoner'],
    ['EXISTING', 'Link a contact to a prisoner'],
  ])('should render enter relationship comments page for each mode %s', async (mode, expectedCaption: string) => {
    // Given
    existingJourney.mode = mode as 'NEW' | 'EXISTING'

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Add additional information about the relationship between the prisoner and First Middle Last',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual(expectedCaption)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_RELATIONSHIP_COMMENTS, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    existingJourney.relationship = {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: 'NO',
      isNextOfKin: 'YES',
      comments: 'Foo',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#comments').val()).toStrictEqual('Foo')
  })

  it('should render invalid data if validation errors and there are no session values', async () => {
    // Given
    const newComments = 'Bar'.padEnd(240)
    flashProvider.mockImplementation(key =>
      key === 'formResponses' ? [JSON.stringify({ comments: newComments })] : [],
    )
    existingJourney.relationship = {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: 'NO',
      isNextOfKin: 'YES',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#comments').val()).toStrictEqual(newComments)
  })

  it('should render invalid data if validation errors and there are session values', async () => {
    // Given
    const newComments = 'Bar'.padEnd(240)
    flashProvider.mockImplementation(key =>
      key === 'formResponses' ? [JSON.stringify({ comments: newComments })] : [],
    )
    existingJourney.relationship = {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: 'NO',
      isNextOfKin: 'YES',
      comments: 'Foo',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#comments').val()).toStrictEqual(newComments)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/create/enter-relationship-comments', () => {
  it('should pass to next page if there are no validation errors and we are not checking answers', async () => {
    // Given
    existingJourney.relationship = { relationshipToPrisoner: 'MOT', isEmergencyContact: 'NO', isNextOfKin: 'YES' }
    existingJourney.isCheckingAnswers = false

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)
      .type('form')
      .send({ comments: 'Foo' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedRelationship = {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: 'NO',
      isNextOfKin: 'YES',
      comments: 'Foo',
    }
    expect(session.addContactJourneys![journeyId]!.relationship).toStrictEqual(expectedRelationship)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)
      .type('form')
      .send({ comments: ''.padEnd(241) })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/enter-relationship-comments/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
