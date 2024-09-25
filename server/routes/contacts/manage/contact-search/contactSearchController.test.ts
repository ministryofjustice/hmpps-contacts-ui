import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import TestData from '../../../testutils/testData'
import AddContactJourney = journeys.AddContactJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

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
    returnPoint: { type: 'MANAGE_PRISONER_CONTACTS', url: '/foo-bar' },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
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
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contacts())

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
    expect($('[data-qa=search-button]').text()).toContain('Search')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_SEARCH_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
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

    expect(session.addContactJourneys[journeyId].searchContact).toStrictEqual({
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

    expect(session.addContactJourneys[journeyId].searchContact).toBeUndefined()
  })

  it('should not pass to result page when rest of the form is completed except last name', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: '', middleName: 'mid', firstName: 'first', day: '01', month: '12', year: '1970' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

    expect(session.addContactJourneys[journeyId].searchContact).toBeUndefined()
  })

  it('should not pass to result page when month and year are not provided', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: 'last', middleName: '', firstName: '', day: '01', month: '', year: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

    expect(session.addContactJourneys[journeyId].searchContact).toBeUndefined()
  })

  it('should not pass to result page when year is not provided', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: 'last', middleName: '', firstName: '', day: '01', month: '12', year: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

    expect(session.addContactJourneys[journeyId].searchContact).toBeUndefined()
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

    expect(session.addContactJourneys[journeyId].searchContact).toBeUndefined()
  })

  it('should not pass to result page when last name contains special characters', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: '&^^^$%%', middleName: '&^^^$%%', firstName: '&^^^$%%', day: '', month: '', year: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

    expect(session.addContactJourneys[journeyId].searchContact).toBeUndefined()
  })
})

describe('Contact seaarch results', () => {
  let results = {
    content: [TestData.contacts()],
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      sort: {
        empty: false,
        sorted: true,
        unsorted: false,
      },
      offset: 0,
      unpaged: false,
      paged: true,
    },
    last: true,
    totalElements: 25,
    totalPages: 3,
    first: true,
    size: 20,
    number: 0,
    sort: {
      empty: false,
      sorted: true,
      unsorted: false,
    },
    numberOfElements: 1,
    empty: false,
  }
  it('should display contact search results table', async () => {
    // Given
    existingJourney = {
      ...existingJourney,
      searchContact: {
        contact: { lastName: 'last', middleName: '', firstName: '' },
        dateOfBirth: { day: undefined, month: undefined, year: undefined },
      },
    }
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(results)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('table')).toBeDefined()
    expect($('table .govuk-table__header:eq(0)').text().trim()).toStrictEqual('Name')
    expect($('table .govuk-table__header:eq(1)').text().trim()).toStrictEqual('Date of birth')
    expect($('table .govuk-table__header:eq(2)').text().trim()).toStrictEqual('Address')

    expect($('table .govuk-table__cell:eq(0) a').text().trim()).toStrictEqual('Mason, Jones')
    expect($('table .govuk-table__cell:eq(1)').text().trim()).toStrictEqual('14/01/1990')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('Flat 32')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('Acacia Avenue')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('Bunting')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('SHEF')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('SYORKS')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('S2 3LK')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('UK')
  })

  it('should display pagination when totalPages greater than 1', async () => {
    // Given
    existingJourney = {
      ...existingJourney,
      searchContact: {
        contact: { lastName: 'last', middleName: '', firstName: '' },
        dateOfBirth: { day: undefined, month: undefined, year: undefined },
      },
    }
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())

    const contactsArray = []
    for (let i = 0; i < 25; i += 1) {
      contactsArray.push(TestData.contacts())
    }

    results = {
      ...results,
      content: contactsArray,
      totalElements: 25,
      totalPages: 3,
    }
    contactsService.searchContact.mockResolvedValue(results)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('.govuk-pagination')).toBeDefined()
    expect($('.govuk-pagination__link').text().trim()).toContain('1')
    expect($('.govuk-pagination__link:eq(1)').text().trim()).toStrictEqual('2')
    expect($('.govuk-pagination__link:eq(2)').text().trim()).toStrictEqual('3')
  })

  it('should display "contact not listed" link when contact searched is not included in the contact search results', async () => {
    // Given
    existingJourney = {
      ...existingJourney,
      searchContact: {
        contact: { lastName: 'last', middleName: '', firstName: '' },
        dateOfBirth: { day: undefined, month: undefined, year: undefined },
      },
    }
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(results)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('[data-qa=contact-not-listed-link]').text()).toContain('The contact is not listed')
  })
})
