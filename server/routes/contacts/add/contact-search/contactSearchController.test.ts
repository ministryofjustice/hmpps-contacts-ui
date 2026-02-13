import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import * as cheerio from 'cheerio'
import { adminUserPermissions, adminUser, appWithAllRoutes } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'

// Mock the config module to enable the feature flag
jest.mock('../../../../config', () => {
  const actualConfig = jest.requireActual('../../../../config')
  return {
    ...actualConfig.default,
    feature: {
      ...actualConfig.default.feature,
      searchByContactIdEnabled: 'true',
    },
  }
})

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = randomUUID()
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
  mockPermissions(app, adminUserPermissions)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('contact search', () => {
  describe('POST /prisoner/:prisonerNumber/contacts/search/:journeyId', () => {
    it('should retain journey state and pass to result page when all fields are provided', async () => {
      // Arrange
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({
          lastName: 'last',
          middleNames: 'middle',
          firstName: 'first',
          contactId: '1234',
          searchType: 'exact',
          sort: 'dateOfBirth,desc',
          day: '01',
          month: '02',
          year: '1980',
        })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

      expect(session.addContactJourneys![journeyId]!.searchContact).toStrictEqual({
        contact: {
          firstName: 'first',
          middleNames: 'middle',
          lastName: 'last',
        },
        dateOfBirth: { day: 1, month: 2, year: 1980 },
        contactId: '1234',
        searchType: 'exact',
        sort: 'dateOfBirth,desc',
        page: 1,
      })
    })

    it('should save enhanced search parameters and GET should call service with ContactSearchRequest', async () => {
      // Ensure GET will try to perform the search when called
      const results = {
        content: [TestData.contactSearchResultItem()],
        page: { number: 0, size: 10, totalElements: 1, totalPages: 1 },
      }
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue(results)

      // When - submit enhanced form including contactId, sort and searchType and a DOB
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({
          lastName: 'last',
          middleNames: '',
          firstName: '',
          contactId: '1234',
          searchType: 'exact',
          sort: 'dateOfBirth,desc',
          day: '01',
          month: '02',
          year: '1980',
        })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

      // Session should have enhanced parameters saved
      expect(session.addContactJourneys![journeyId]!.searchContact).toStrictEqual({
        contact: {
          lastName: 'last',
          middleNames: undefined,
          firstName: undefined,
        },
        dateOfBirth: { day: 1, month: 2, year: 1980 },
        contactId: '1234',
        sort: 'dateOfBirth,desc',
        searchType: 'exact',
        page: 1,
      })

      // And when rendering the GET, the controller should call the contactsService with the ContactSearchRequest containing contactId and searchType
      const getResponse = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      expect(getResponse.status).toEqual(200)
      expect(contactsService.searchContact).toHaveBeenCalled()

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const calledRequest = contactsService.searchContact.mock.calls[0][0]
      expect(calledRequest).toMatchObject({
        contactId: '1234',
        lastName: 'last',
        searchType: 'exact',
      })
    })

    it('with no names, id or dob should set validation error and not call service', async () => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())

      // When - submit empty enhanced form (all blank)
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({
          lastName: '',
          middleNames: '',
          firstName: '',
          contactId: '',
          searchType: '',
          day: '',
          month: '',
          year: '',
        })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

      // Then GET should render page showing validation errors and should NOT call the search service
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      expect(response.status).toEqual(200)
      // Top-level error summary should include the message set by validateRequest
      expect(response.text).toContain('There is a problem')
      expect(response.text).toContain('Enter a contact’s name, ID, or date of birth')
      expect(contactsService.searchContact).not.toHaveBeenCalled()
    })

    // with invalid character in name fields should set validation error and not call service
    it('with invalid character in name fields should set validation error and not call service', async () => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())

      // When - submit enhanced form with invalid characters in name fields
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({
          lastName: 'last#name',
          middleNames: 'middle%',
          firstName: 'first&',
          contactId: '',
          searchType: '',
          day: '',
          month: '',
          year: '',
        })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

      // Then GET should render page showing validation errors and should NOT call the search service
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      expect(response.status).toEqual(200)
      // Top-level error summary should include the message set by validateRequest
      expect(response.text).toContain('There is a problem')
      expect(response.text).toContain('First name must not contain &quot;&amp;&quot;')
      expect(response.text).toContain('Middle name must not contain &quot;%&quot;')
      expect(response.text).toContain('Last name must not contain &quot;#&quot;')
      expect(contactsService.searchContact).not.toHaveBeenCalled()
    })

    it('with invalid contact id should set validation error and not call service', async () => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())

      // When - submit enhanced form with invalid contact id
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({
          lastName: 'lastName',
          middleNames: 'middle',
          firstName: 'first',
          contactId: 'contact#1',
          searchType: '',
          day: '',
          month: '',
          year: '',
        })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

      // Then GET should render page showing validation errors and should NOT call the search service
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      expect(response.status).toEqual(200)
      // Top-level error summary should include the message set by validateRequest
      expect(response.text).toContain('There is a problem')
      expect(response.text).toContain('Contact ID must not contain &quot;c&quot;')
      expect(contactsService.searchContact).not.toHaveBeenCalled()
    })

    // should contain more than 2 characters for lastName, firstName, middleNames validation
    it('should contain more than 2 characters for lastName, firstName, middleNames validation', async () => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())

      // When - submit enhanced form with short names
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
        .type('form')
        .send({
          lastName: 'l',
          middleNames: 'm',
          firstName: 'f',
          contactId: '',
          searchType: '',
          day: '',
          month: '',
          year: '',
        })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

      // Then GET should render page showing validation errors and should NOT call the search service
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      expect(response.status).toEqual(200)
      // Top
      expect(response.text).toContain('There is a problem')
      expect(response.text).toContain('Last name must be 2 characters or more')
      expect(response.text).not.toContain('First name must be 2 characters or more')
      expect(response.text).not.toContain('Middle name must be 2 characters or more')
      expect(contactsService.searchContact).not.toHaveBeenCalled()
    })
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

    it('should render enhanced search form with advanced controls and date fields', async () => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue({
        page: {
          totalPages: 0,
          totalElements: 0,
        },
        content: [],
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      const $ = cheerio.load(response.text)

      // Then - name inputs (optional)
      expect($('input#firstName')).toBeDefined()
      expect($('label[for="firstName"]').text().trim()).toContain('First name')
      expect($('input#middleNames')).toBeDefined()
      expect($('label[for="middleNames"]').text().trim()).toContain('Middle names')
      expect($('input#lastName')).toBeDefined()
      expect($('label[for="lastName"]').text().trim()).toContain('Last name')

      // advanced options summary text
      expect($('summary').text()).toContain('Show advanced options')

      // sort select and its label
      expect($('select#sort')).toHaveLength(1)
      expect($('label[for="sort"]').text().trim()).toContain('Sort by')
      // search type select and options + hint
      expect($('select#searchType')).toHaveLength(1)
      expect($('select#searchType option[value="PARTIAL"]').length).toBeGreaterThan(0)
      expect($('select#searchType option[value="EXACT"]').length).toBeGreaterThan(0)
      expect($('select#searchType option[value="SOUNDS_LIKE"]').length).toBeGreaterThan(0)
      expect($('div#searchType-hint').text().trim()).toContain('Choose how results match your search term')

      // contact id input
      expect($('input#contactId')).toBeDefined()
      expect($('label[for="contactId"]').text().trim()).toContain('Search by contact ID')

      // date inputs
      expect($('input#day')).toBeDefined()
      expect($('input#month')).toBeDefined()
      expect($('input#year')).toBeDefined()

      // ensure old soundsLike checkbox (normal version) not present in enhanced UI
      expect($('label[for="soundsLike"]').text().trim()).toBe('')
    })

    it('should display truncation message when totalElements > 2000', async () => {
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
        content: [TestData.contactSearchResultItem()],
        page: {
          number: 0,
          size: 20,
          totalElements: 2000, // exactly 2000 to trigger message
          totalPages: 75,
        },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      const $ = cheerio.load(response.text)

      // Then
      expect(response.status).toEqual(200)
      expect($('div.moj-alert__content')).toBeDefined()
      expect($('div.moj-alert__content').text().trim()).toContain(
        'Your search returned a large number of results. Only the top 2000 are shown. Refine your search to narrow the results.',
      )
    })
  })
})
