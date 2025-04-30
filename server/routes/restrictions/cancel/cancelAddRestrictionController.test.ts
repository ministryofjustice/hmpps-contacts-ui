import type { Express } from 'express'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../testutils/appSetup'
import { Page } from '../../../services/auditService'
import TestData from '../../testutils/testData'
import { MockedService } from '../../../testutils/mockedServices'
import { AddRestrictionJourney } from '../../../@types/journeys'
import { HmppsUser } from '../../../interfaces/hmppsUser'

jest.mock('../../../services/auditService')
jest.mock('../../../services/contactsService')
jest.mock('../../../services/referenceDataService')
jest.mock('../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const contactId = 123456
const prisonerContactId = 987564
const prisonerNumber = 'A1234BC'
let journey: AddRestrictionJourney
let currentUser = authorisingUser
beforeEach(() => {
  journey = {
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
  }

  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      referenceDataService,
      prisonerSearchService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addRestrictionJourneys = {}
      session.addRestrictionJourneys[journeyId] = journey
    },
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/cancel/:journeyId', () => {
  it('should render cancel page', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${journeyId}`,
    )

    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Are you sure you want to cancel adding a restriction? - Manage contact restrictions - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contact restrictions')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to cancel adding a restriction?',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contact restrictions')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/check-answers/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=prisoner-and-contact-details]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CANCEL_RESTRICTION_PAGE, {
      who: authorisingUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '123456',
        prisonerContactId: '987564',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should return not found if no journey in session', async () => {
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${uuidv4()}`,
      )
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 403],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%s, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${journeyId}`,
      )
      .expect(expectedStatus)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/cancel/:journeyId', () => {
  it('should return to contact list and remove from session if cancelling', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${journeyId}`,
      )
      .type('form')
      .send({ action: 'YES' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    // Then
    expect(session.addRestrictionJourneys![journeyId]).toBeUndefined()
  })

  it('should return to check answers if not cancelling', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${journeyId}`,
      )
      .type('form')
      .send({ action: 'NO' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/check-answers/${journeyId}`,
      )

    // Then
    expect(session.addRestrictionJourneys![journeyId]).not.toBeUndefined()
  })

  it('should return not found if no journey in session', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${uuidv4()}`,
      )
      .type('form')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 403],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%s, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/cancel/${journeyId}`,
      )
      .type('form')
      .send({ action: 'YES' })
      .expect(expectedStatus)
  })
})
