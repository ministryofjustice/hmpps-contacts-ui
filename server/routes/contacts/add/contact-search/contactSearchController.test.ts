import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { adminUserPermissions, adminUser, appWithAllRoutes } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { PagedModelContactSearchResultItem } from '../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

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
  mockPermissions(app, adminUserPermissions)
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
    expect($('label[for="soundsLike"]').text().trim()).toBe('Sounds like search')
    expect($('label[for="contactId"]').text().trim()).toBe('Contact ID (optional)')
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

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue({
      page: {
        totalPages: 0,
        totalElements: 0,
      },
      content: [TestData.contactSearchResultItem()],
    })
    await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`).expect(403)
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
      contactId: undefined,
      page: 1,
      soundsLike: false,
    })
  })

  it('should pass the sounds like when it is enabled', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: 'last', middleNames: '', firstName: '', soundsLike: 'true' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact).toStrictEqual({
      contact: {
        firstName: undefined,
        middleNames: undefined,
        lastName: 'last',
      },
      contactId: undefined,
      page: 1,
      soundsLike: true,
    })
  })

  it('should pass the contact id when it is provided', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: 'last', middleNames: '', firstName: '', contactId: '1234' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}#`)

    expect(session.addContactJourneys![journeyId]!.searchContact).toStrictEqual({
      contact: {
        firstName: undefined,
        middleNames: undefined,
        lastName: 'last',
      },
      contactId: '1234', // assert contact id is set into the request
      page: 1,
      soundsLike: false,
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
      contactId: undefined,
      page: 1,
      soundsLike: false,
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
      contactId: undefined,
      soundsLike: false,
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

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      .type('form')
      .send({ lastName: 'last', middleNames: '', firstName: '' })
      .expect(403)
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

describe('contact search enhanced version', () => {
  beforeEach(() => {
    process.env['FEATURE_ENHANCED_CONTACT_SEARCH'] = 'MDI,KMI'
  })

  afterEach(() => {
    process.env['FEATURE_ENHANCED_CONTACT_SEARCH'] = ''
  })

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

    it('should save enhanced search parameters and GET should call service with EnhancedContactSearchRequest', async () => {
      // Ensure GET will try to perform the search when called
      const results = {
        content: [TestData.contactSearchResultItem()],
        page: { number: 0, size: 10, totalElements: 1, totalPages: 1 },
      }
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContactV2.mockResolvedValue(results)

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

      // And when rendering the GET, the controller should call the contactsService with the EnhancedContactSearchRequest containing contactId and searchType
      const getResponse = await request(app).get(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
      expect(getResponse.status).toEqual(200)
      expect(contactsService.searchContactV2).toHaveBeenCalled()

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const calledRequest = contactsService.searchContactV2.mock.calls[0][0]
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
      expect(response.text).toContain('Contact ID must not contain &quot;#&quot;')
      expect(contactsService.searchContact).not.toHaveBeenCalled()
    })
  })

  describe('GET /prisoner/:prisonerNumber/contacts/search/:journeyId', () => {
    it('should render contact page without filter when there is no search', async () => {
      // Given
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContactV2.mockResolvedValue({
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
      contactsService.searchContactV2.mockResolvedValue({
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
  })
})
