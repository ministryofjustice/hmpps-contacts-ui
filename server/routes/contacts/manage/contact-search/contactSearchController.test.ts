import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import ManageContactsJourney = journeys.ManageContactsJourney

jest.mock('../../../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: ManageContactsJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    search: { searchTerm: 'Name' },
    prisoner: {
      firstName: 'first',
      lastName: 'last',
      prisonerNumber: 'A1234BC',
      dateOfBirth: '1986-06-27',
      prisonId: 'MDI',
      prisonName: 'Moorland (HMP & YOI)',
    },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.manageContactsJourneys = {}
      session.manageContactsJourneys[journeyId] = existingJourney
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/search/:journeyId', () => {
  it('should render contact page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('h1.govuk-heading-l').text()).toContain('Search for Contact')
    expect($('input#firstName')).toBeDefined()
    expect($('input#middleName')).toBeDefined()
    expect($('input#lastName')).toBeDefined()
    expect($('input#day')).toBeDefined()
    expect($('input#month')).toBeDefined()
    expect($('input#year')).toBeDefined()

    expect($('.govuk-form-group .govuk-label').eq(0).text()).toContain('First name')
    expect($('.govuk-form-group .govuk-label').eq(1).text()).toContain('Middle names')
    expect($('.govuk-form-group .govuk-label').eq(2).text()).toContain('Last name')
    expect($('.govuk-fieldset__legend').text()).toContain('Date of birth')
    expect($('[data-qa=continue-button]').text()).toContain('Search')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_SEARCH_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  describe('POST /prisoner/:prisonerNumber/contacts/search/:journeyId', () => {
    it('should pass to result page when last name provided', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({ lastName: 'last', middleName: '', firstName: '', day: '', month: '', year: '' })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

      expect(session.manageContactsJourneys[journeyId].searchContact).toStrictEqual({
        contact: {
          firstName: '',
          middleName: undefined,
          lastName: 'last',
        },
        dateOfBirth: {
          day: '',
          month: '',
          year: '',
        },
      })
    })

    it('should not pass to result page when last name is not provided', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({ lastName: '', middleName: '', firstName: '', day: '', month: '', year: '' })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

      expect(session.manageContactsJourneys[journeyId].searchContact).toBeUndefined()
    })

    it('should not pass to result page when rest of the form is completed except last name', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({ lastName: '', middleName: 'mid', firstName: 'first', day: '01', month: '12', year: '1970' })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

      expect(session.manageContactsJourneys[journeyId].searchContact).toBeUndefined()
    })

    it('should not pass to result page when month and year are not provided', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({ lastName: 'last', middleName: '', firstName: '', day: '01', month: '', year: '' })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

      expect(session.manageContactsJourneys[journeyId].searchContact).toBeUndefined()
    })

    it('should not pass to result page when year is not provided', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({ lastName: 'last', middleName: '', firstName: '', day: '01', month: '12', year: '' })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

      expect(session.manageContactsJourneys[journeyId].searchContact).toBeUndefined()
    })

    it('should not pass to result page when date is in the future', async () => {
      const date = new Date(Date.now())
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({
          lastName: '',
          middleName: '',
          firstName: '',
          day: '01',
          month: '12',
          year: date.setDate(date.getDate() + 1),
        })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

      expect(session.manageContactsJourneys[journeyId].searchContact).toBeUndefined()
    })

    it('should not pass to result page when last name contains special characters', async () => {
      const date = new Date(Date.now())
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({ lastName: '&^^^$%%', middleName: '&^^^$%%', firstName: '&^^^$%%', day: '', month: '', year: '' })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

      expect(session.manageContactsJourneys[journeyId].searchContact).toBeUndefined()
    })
  })
})
