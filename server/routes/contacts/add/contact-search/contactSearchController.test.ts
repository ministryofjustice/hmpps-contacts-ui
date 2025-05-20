import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { PagedModelContactSearchResultItem } from '../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../interfaces/hmppsUser'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

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
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => currentUser,
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
  it('should render contact page without filter when there is no search', async () => {
    // Given
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue({
      page: {
        totalPages: 0,
        totalElements: 0,
      },
      content: [TestData.contactSearchResultItem()],
    })

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('title').text()).toStrictEqual('Check if the contact is already on the system - Manage contacts - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Link a contact to a prisoner')
    expect($('h1.govuk-heading-l').text()).toContain('Check if the contact is already on the system')
    expect($('input#firstName')).toBeDefined()
    expect($('input#middleNames')).toBeDefined()
    expect($('input#lastName')).toBeDefined()

    expect($('.govuk-form-group .govuk-label').eq(0).text()).toContain('First name')
    expect($('.govuk-form-group .govuk-label').eq(1).text()).toContain('Middle names')
    expect($('.govuk-form-group .govuk-label').eq(2).text()).toContain('Last name')
    expect($('.govuk-fieldset__legend:contains("Date of birth")').text()).toBeFalsy()
    expect($('[data-qa=search-button]').text()).toContain('Search')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(`/prisoner/${prisonerNumber}/contacts/list`)
    expect($('[data-qa=back-link]').first().text()).toStrictEqual('Back to prisoner’s contact list')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_SEARCH_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render contact page with filter when there is a search', async () => {
    // Given
    existingJourney.searchContact = {
      contact: { lastName: 'name' },
    }

    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue({
      page: {
        totalPages: 0,
        totalElements: 0,
      },
      content: [TestData.contactSearchResultItem()],
    })

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('.govuk-fieldset__legend:contains("Date of birth")').text()).toBeTruthy()
    expect($('input#day')).toBeDefined()
    expect($('input#month')).toBeDefined()
    expect($('input#year')).toBeDefined()
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue({
      page: {
        totalPages: 0,
        totalElements: 0,
      },
      content: [TestData.contactSearchResultItem()],
    })
    await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`).expect(expectedStatus)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/search/:journeyId', () => {
  it('should pass to result page when last name provided', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: 'last', middleNames: '', firstName: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact).toStrictEqual({
      contact: {
        firstName: undefined,
        middleNames: undefined,
        lastName: 'last',
      },
      page: 1,
    })
  })

  it('should pass to result page when last name is not provided', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: '', middleNames: 'middle', firstName: 'first' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact).toStrictEqual({
      contact: {
        firstName: 'first',
        middleNames: 'middle',
        lastName: undefined,
      },
      page: 1,
    })
  })

  it.each([
    [
      { lastName: '', middleNames: 'middle', firstName: 'first' },
      { firstName: 'first', middleNames: 'middle', lastName: undefined },
    ],
    [
      { lastName: '#123', middleNames: 'middle', firstName: '' },
      { firstName: undefined, middleNames: 'middle', lastName: '#123' },
    ],
    [
      { lastName: 'last', middleNames: '%foo', firstName: '' },
      { firstName: undefined, middleNames: '%foo', lastName: 'last' },
    ],
    [
      { lastName: 'last', middleNames: 'middle', firstName: '&thisIsIt;' },
      { firstName: '&thisIsIt;', middleNames: 'middle', lastName: 'last' },
    ],
  ])('should pass to result page when names are not valid', async (form, expectedContact) => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send(form)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact).toStrictEqual({
      contact: expectedContact,
      page: 1,
    })
    expect(contactsService.searchContact).not.toHaveBeenCalled()
  })

  it('should save DoB to session when search names are in session', async () => {
    existingJourney.searchContact = { contact: { lastName: 'last' } }

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ day: '01', month: '12', year: '1999' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact!.dateOfBirth).toStrictEqual({
      day: 1,
      month: 12,
      year: 1999,
    })
  })

  it('should not save DoB to session when search names are not in session', async () => {
    existingJourney.searchContact = {}

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ day: '01', month: '12', year: '1999' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact!.dateOfBirth).toBeUndefined()
  })

  it('should not save DoB to session when month and year are not provided', async () => {
    existingJourney.searchContact = { contact: { lastName: 'last' } }

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ day: '01', month: '', year: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact!.dateOfBirth).toBeUndefined()
  })

  it('should not save DoB to session when year is not provided', async () => {
    existingJourney.searchContact = { contact: { lastName: 'last' } }

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ day: '01', month: '12', year: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact!.dateOfBirth).toBeUndefined()
  })

  it('should not save DoB to session when date is in the future', async () => {
    existingJourney.searchContact = { contact: { lastName: 'last' } }
    const date = new Date(Date.now())
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({
        day: '01',
        month: '12',
        year: date.setDate(date.getDate() + 1),
      })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact!.dateOfBirth).toBeUndefined()
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: 'last', middleNames: '', firstName: '' })
      .expect(expectedStatus)
  })
})

describe('Contact seaarch results', () => {
  const results: PagedModelContactSearchResultItem = {
    content: [TestData.contactSearchResultItem()],
    page: {
      number: 0,
      size: 20,
      totalElements: 25,
      totalPages: 3,
    },
  }
  it('should display contact search results table', async () => {
    // Given
    existingJourney = {
      ...existingJourney,
      searchContact: {
        contact: { lastName: 'last', middleNames: '', firstName: '' },
        dateOfBirth: {},
      },
    }
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(results)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('table')).toBeDefined()
    expect($('table .govuk-table__header:eq(0)').text().trim()).toStrictEqual('Contact name and person ID')
    expect($('table .govuk-table__header:eq(1)').text().trim()).toStrictEqual('Date of birth')
    expect($('table .govuk-table__header:eq(2)').text().trim()).toStrictEqual('Primary or default address')
    expect($('table .govuk-table__header:eq(3)').text().trim()).toStrictEqual('Action')

    expect($('table .govuk-table__cell:eq(0)').text().trim()).toContain('Mason, Jones')
    expect($('table .govuk-table__cell:eq(1)').text().trim()).toContain('14/1/1990')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('32')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('Acacia Avenue')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('Bunting')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('Sheffield')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('South Yorkshire')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('S2 3LK')
    expect($('table .govuk-table__cell:eq(2)').text().trim()).toContain('England')
  })

  it('should display "no contact records" when there is no search results', async () => {
    // Given
    existingJourney = {
      ...existingJourney,
      searchContact: {
        contact: { lastName: 'last', middleNames: '', firstName: '' },
        dateOfBirth: {},
      },
    }
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue({
      content: [],
      page: {
        number: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
    })

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('p:contains("No contact records match your search")').text()).toBeTruthy()
  })
})
