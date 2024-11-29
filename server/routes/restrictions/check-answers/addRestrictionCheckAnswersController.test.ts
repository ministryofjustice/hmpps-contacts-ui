import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import AuditService, { Page } from '../../../services/auditService'
import ReferenceDataService from '../../../services/referenceDataService'
import { mockedReferenceData } from '../../testutils/stubReferenceData'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import RestrictionsService from '../../../services/restrictionsService'
import TestData from '../../testutils/testData'
import AddRestrictionJourney = journeys.AddRestrictionJourney
import RestrictionClass = journeys.RestrictionClass

jest.mock('../../../services/auditService')
jest.mock('../../../services/referenceDataService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/restrictionsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const restrictionsService = new RestrictionsService(null) as jest.Mocked<RestrictionsService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = 123
const prisonerContactId = 321
let existingJourney: AddRestrictionJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    contactId,
    prisonerContactId,
    restrictionClass: 'PRISONER_CONTACT',
    contactNames: {
      lastName: 'foo',
      firstName: 'bar',
    },
    restriction: {
      type: 'BAN',
      startDate: '01/02/2008',
    },
    returnPoint: { url: '/foo-bar' },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      restrictionsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addRestrictionJourneys = {}
      session.addRestrictionJourneys[journeyId] = existingJourney
    },
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/check-answers/:journeyId', () => {
  it('should render enter restriction page for prisoner-contact with minimal details', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Banned')
    existingJourney.restrictionClass = 'PRISONER_CONTACT'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before saving the new prisoner-contact restriction',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=prisoner-name-and-id]').first().text().trim()).toStrictEqual('John Smith (A1234BC)')
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('Bar Foo (123)')
    expect($('[data-qa=back-link]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Banned')
    expect($('.check-answers-start-date-value').text().trim()).toStrictEqual('1 February 2024')
    expect($('.check-answers-expiry-date-value').text().trim()).toStrictEqual('Not provided')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Not provided')
  })

  it('should render enter restriction page for estate wide with minimal details', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Banned')
    existingJourney.restrictionClass = 'CONTACT_GLOBAL'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before saving the new global restriction',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=prisoner-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('Bar Foo (123)')
    expect($('[data-qa=back-link]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Banned')
    expect($('.check-answers-start-date-value').text().trim()).toStrictEqual('1 February 2024')
    expect($('.check-answers-expiry-date-value').text().trim()).toStrictEqual('Not provided')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Not provided')
  })

  it('should render enter restriction page for prisoner-contact with all details', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Banned')
    existingJourney.restrictionClass = 'PRISONER_CONTACT'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'Some comments',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before saving the new prisoner-contact restriction',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=prisoner-name-and-id]').first().text().trim()).toStrictEqual('John Smith (A1234BC)')
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('Bar Foo (123)')
    expect($('[data-qa=back-link]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Banned')
    expect($('.check-answers-start-date-value').text().trim()).toStrictEqual('1 February 2024')
    expect($('.check-answers-expiry-date-value').text().trim()).toStrictEqual('2 March 2025')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Some comments')
  })

  it('should render enter restriction page for estate wide with all details', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Banned')
    existingJourney.restrictionClass = 'CONTACT_GLOBAL'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'Some comments',
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Check your answers before saving the new global restriction',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=prisoner-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('Bar Foo (123)')
    expect($('[data-qa=back-link]')).toHaveLength(0)
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.check-answers-type-value').text().trim()).toStrictEqual('Banned')
    expect($('.check-answers-start-date-value').text().trim()).toStrictEqual('1 February 2024')
    expect($('.check-answers-expiry-date-value').text().trim()).toStrictEqual('2 March 2025')
    expect($('.check-answers-comments-value').text().trim()).toStrictEqual('Some comments')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.restrictionClass = 'PRISONER_CONTACT'
    existingJourney.restriction = {
      type: 'BAN',
      startDate: '1/2/2024',
    }
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_RESTRICTION_CHECK_ANSWERS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/check-answers/${uuidv4()}`,
      )
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/CONTACT_GLOBAL/start`,
      )
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/check-answers/:journeyId', () => {
  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should pass to check answers page if there are no validation errors',
    async (restrictionClass: RestrictionClass) => {
      existingJourney.restrictionClass = restrictionClass
      restrictionsService.createRestriction.mockResolvedValue({})

      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/check-answers/${journeyId}`,
        )
        .type('form')
        .send({ type: 'BAN', startDate: '1/2/2024', expiryDate: '2/3/2025', comments: 'some comments' })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/success`,
        )

      expect(restrictionsService.createRestriction).toHaveBeenCalledWith(existingJourney, user)
    },
  )

  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should return to start if no journey in session',
    async (restrictionClass: RestrictionClass) => {
      existingJourney.restrictionClass = restrictionClass
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/check-answers/${uuidv4()}`,
        )
        .type('form')
        .send({ firstName: 'first' })
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/start`,
        )
    },
  )
})
