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
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary
import PrisonerContactSummaryPage = contactsApiClientTypes.PrisonerContactSummaryPage

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.manageContactsJourneys = {}
      session.manageContactsJourneys[journeyId] = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        search: {
          searchTerm: 'A4162DZ',
        },
        prisoner: {
          prisonerNumber: 'A4162DZ',
          firstName: 'Jon',
          lastName: 'Harper',
          dateOfBirth: '1 Aug 1974',
          prisonName: 'Moorland HMP',
        },
        activateListPage: 0,
        inactivateListPage: 0,
      }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})
describe('listContactsController', () => {
  describe('GET /prisoner/:prisonerNumber/contacts/list/:journeyId', () => {
    it('should render the contacts list for a prisoner', async () => {
      const classes = '#active-contacts > .govuk-table > .govuk-table__body > .govuk-table__row >'
      auditService.logPageView.mockResolvedValue(null)
      const contactsList: PrisonerContactSummary = [
        {
          prisonerContactId: 100,
          contactId: 200,
          prisonerNumber: 'G9381UV',
          lastName: 'Adams',
          firstName: 'Claire',
          middleNames: '',
          dateOfBirth: new Date('1973-01-10'),
          relationshipCode: 'code here',
          relationshipDescription: 'Friend',
          flat: '1',
          property: 'Property',
          street: '123 High Street',
          area: 'Mayfair',
          cityCode: 'LON',
          cityDescription: 'London',
          countyCode: 'LON',
          countyDescription: 'Greater London',
          postCode: 'W1 1AA',
          countryCode: 'ENG',
          countryDescription: 'England',
          approvedVisitor: true,
          nextOfKin: true,
          emergencyContact: true,
          awareOfCharges: true,
          comments: 'comments here',
        },
      ]

      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getPrisonerContacts.mockResolvedValue({ content: contactsList } as PrisonerContactSummaryPage)

      const response = await request(app).get(`/prisoner/A462DZ/contacts/list/${journeyId}`)
      const $ = cheerio.load(response.text)

      // Prisoner
      expect($('[data-qa="mini-profile-person-profile-link"]').text()).toStrictEqual('Smith, John')
      expect($('[data-qa="mini-profile-prisoner-number"]').text()).toStrictEqual('A1234BC')
      expect($('[data-qa="mini-profile-dob"]').text()).toStrictEqual('2 April 1975')
      expect($('[data-qa="mini-profile-prison-name"]').text()).toStrictEqual('HMP Hewell')
      expect($('[data-qa="mini-profile-cell-location"]').text()).toStrictEqual('1-1-C-028')

      // Button
      expect($('.govuk-button').text()).toContain('Add prisoner contact')

      // Contact List Table
      expect($('.govuk-heading-l').text()).toStrictEqual('Contacts for Smith, John')
      expect($('.govuk-table__header').eq(0).text()).toStrictEqual('Name')
      expect($('.govuk-table__header').eq(1).text()).toStrictEqual('Date of birth')

      expect($('.govuk-table__header').eq(2).text()).toStrictEqual('Address')
      expect($('.govuk-table__header').eq(3).text()).toStrictEqual('Relationship to prisoner')
      expect($('.govuk-table__header').eq(4).text()).toStrictEqual('Emergency contact')
      expect($('.govuk-table__header').eq(5).text()).toStrictEqual('Next of kin')
      expect($('.govuk-table__header').eq(6).text()).toStrictEqual('Approved')

      expect($(`${classes} :nth-child(1) > a`).text()).toContain('Adams, Claire')
      expect($(`${classes} :nth-child(2)`).text()).toContain('10 January 1973')
      expect($(`${classes} :nth-child(2)`).text()).toContain('(52 years old)')
      expect($(`${classes} :nth-child(3)`).text()).toContain('Flat 1,')
      expect($(`${classes} :nth-child(3)`).text()).toContain('Property')
      expect($(`${classes} :nth-child(3)`).text()).toContain('123 High Street')
      expect($(`${classes} :nth-child(3)`).text()).toContain('Mayfair')
      expect($(`${classes} :nth-child(3)`).text()).toContain('London')
      expect($(`${classes} :nth-child(3)`).text()).toContain('Greater London')
      expect($(`${classes} :nth-child(3)`).text()).toContain('W1 1AA')
      expect($(`${classes} :nth-child(3)`).text()).toContain('England')
      expect($(`${classes} :nth-child(4)`).text()).toContain('Friend')
      expect($(`${classes} :nth-child(5)`).text()).toContain('Yes')
      expect($(`${classes} :nth-child(6)`).text()).toContain('Yes')
      expect($(`${classes} :nth-child(7)`).text()).toContain('Yes')

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.LIST_CONTACTS_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
    })

    it('should render the contacts list for a prisoner with emergency contact, next of kin and approved visitors with "No" value', async () => {
      const classes = '#active-contacts > .govuk-table > .govuk-table__body > .govuk-table__row >'
      auditService.logPageView.mockResolvedValue(null)
      const contactsList: PrisonerContactSummary = [
        {
          prisonerContactId: 100,
          contactId: 200,
          prisonerNumber: 'G9381UV',
          lastName: 'Adams',
          firstName: 'Claire',
          middleNames: '',
          dateOfBirth: new Date('1973-01-10'),
          relationshipCode: 'code here',
          relationshipDescription: 'Friend',
          flat: '1',
          property: 'Property',
          street: '123 High Street',
          area: 'Mayfair',
          cityCode: 'LON',
          cityDescription: 'London',
          countyCode: 'LON',
          countyDescription: 'Greater London',
          postCode: 'W1 1AA',
          countryCode: 'ENG',
          countryDescription: 'England',
          approvedVisitor: false,
          nextOfKin: false,
          emergencyContact: false,
          awareOfCharges: true,
          comments: 'comments here',
        },
      ]

      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getPrisonerContacts.mockResolvedValue({ content: contactsList } as PrisonerContactSummaryPage)

      const response = await request(app).get(`/prisoner/A462DZ/contacts/list/${journeyId}`)
      const $ = cheerio.load(response.text)

      expect($(`${classes} :nth-child(5)`).text()).toContain('No')
      expect($(`${classes} :nth-child(6)`).text()).toContain('No')
      expect($(`${classes} :nth-child(7)`).text()).toContain('No')

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.LIST_CONTACTS_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
    })

    it('should render a message that the prisoner does not have any active/inactive contacts', async () => {
      auditService.logPageView.mockResolvedValue(null)
      const contactsList: PrisonerContactSummaryPage = {
        content: [],
      }

      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getPrisonerContacts.mockReturnValue(contactsList)

      const response = await request(app).get(`/prisoner/A462DZ/contacts/list/${journeyId}`)
      const $ = cheerio.load(response.text)

      expect($('#active-contacts > div > p').text()).toStrictEqual('John Smith does not have any active contacts')
      expect($('#inactive-contacts > div > p').text()).toStrictEqual('John Smith does not have any inactive contacts')

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.LIST_CONTACTS_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
    })

    it('should render a message that the prisoner dob was not provided', async () => {
      auditService.logPageView.mockResolvedValue(null)
      const contactsList: PrisonerContactSummary = [
        {
          prisonerContactId: 100,
          contactId: 200,
          prisonerNumber: 'G9381UV',
          lastName: 'Adams',
          firstName: 'Claire',
          middleNames: '',
          dateOfBirth: undefined,
          relationshipCode: 'code here',
          relationshipDescription: 'Friend',
          flat: '1',
          property: 'Property',
          street: '123 High Street',
          area: 'Mayfair',
          cityCode: 'LON',
          cityDescription: 'London',
          countyCode: 'LON',
          countyDescription: 'Greater London',
          postCode: 'W1 1AA',
          countryCode: 'ENG',
          countryDescription: 'England',
          approvedVisitor: false,
          nextOfKin: false,
          emergencyContact: false,
          awareOfCharges: true,
          comments: 'comments here',
        },
      ]

      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getPrisonerContacts.mockResolvedValue({ content: contactsList } as PrisonerContactSummaryPage)

      const response = await request(app).get(`/prisoner/A462DZ/contacts/list/${journeyId}`)

      const $ = cheerio.load(response.text)
      expect($('[data-qa=contact-100-dob]').text()).toContain('Not provided')
    })

    it('should return to prisoner contact list without a journey if the journey ID is not recognised in the session', async () => {
      await request(app)
        .get(`/prisoner/A462DZ/contacts/list/${uuidv4()}`)
        .expect(302)
        .expect('Location', '/prisoner/A462DZ/contacts/list')
    })
  })

  describe('Active/Inactive Pagination', () => {
    const contactsList: PrisonerContactSummary = [
      {
        prisonerContactId: 100,
        contactId: 200,
        prisonerNumber: 'G9381UV',
        lastName: 'Adams',
        firstName: 'Claire',
        middleNames: '',
        dateOfBirth: new Date('1973-01-10'),
        relationshipCode: 'code here',
        relationshipDescription: 'Friend',
        flat: '1',
        property: 'Property',
        street: '123 High Street',
        area: 'Mayfair',
        cityCode: 'LON',
        cityDescription: 'London',
        countyCode: 'LON',
        countyDescription: 'Greater London',
        postCode: 'W1 1AA',
        countryCode: 'ENG',
        countryDescription: 'England',
        approvedVisitor: true,
        nextOfKin: true,
        emergencyContact: true,
        awareOfCharges: true,
        comments: 'comments here',
      },
    ]

    const contactListResponse = {
      content: contactsList,
      pageable: {
        pageNumber: 0,
        pageSize: 10,
        sort: {
          empty: true,
          sorted: false,
          unsorted: true,
        },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: false,
      totalElements: 542,
      totalPages: 55,
      first: true,
      size: 10,
      number: 0,
      sort: {
        empty: true,
        sorted: false,
        unsorted: true,
      },
      numberOfElements: 10,
      empty: false,
    }

    describe('Active', () => {
      it('should render pagination for active contacts list', async () => {
        // Given
        auditService.logPageView.mockResolvedValue(null)
        prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
        contactsService.getPrisonerContacts.mockResolvedValue({ ...contactListResponse } as PrisonerContactSummaryPage)

        // When
        const response = await request(app).get(
          `/prisoner/A462DZ/contacts/list/${journeyId}?page=0&tab=active-contacts#active-contacts`,
        )
        const $ = cheerio.load(response.text)

        // Then
        expect(response.status).toEqual(200)
        expect($('[data-qa=active-list]').hasClass('govuk-tabs__list-item--selected')).toBe(true)
        expect($('[data-qa=inactive-list]').hasClass('govuk-tabs__list-item--selected')).toBe(false)
        expect($('.moj-pagination__item').text().trim()).toContain('1')
        expect($('.moj-pagination__item').text().trim()).toContain('2')
        expect($('.moj-pagination__item--dots').text().trim()).toContain('…')
        expect($('.moj-pagination__item').text().trim()).toContain('55')
        expect($('.moj-pagination__item').text().trim()).not.toContain('56')
      })

      it('should hide previous link when page equal or greater than 1 is selected', async () => {
        // Given
        auditService.logPageView.mockResolvedValue(null)
        prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
        const actviveResponseList = {
          ...contactListResponse,
          numberOfElements: 50,
          totalElements: 5,
          totalPages: 5,
          first: true,
          last: false,
          number: 0,
        }
        contactsService.getPrisonerContacts.mockResolvedValue({ ...actviveResponseList } as PrisonerContactSummaryPage)

        // When
        const response = await request(app).get(
          `/prisoner/A462DZ/contacts/list/${journeyId}?page=0&tab=active-contacts#active-contacts`,
        )
        const $ = cheerio.load(response.text)

        // Then
        expect(response.status).toEqual(200)
        expect($('[data-qa=active-list]').hasClass('govuk-tabs__list-item--selected')).toBe(true)
        expect($('[data-qa=inactive-list]').hasClass('govuk-tabs__list-item--selected')).toBe(false)
        expect($('.moj-pagination')).toBeDefined()
        expect($('#active-contacts .moj-pagination__item--active').text().trim()).toStrictEqual('1')
        expect($('#active-contacts .moj-pagination__link:eq(0)').text().trim()).toStrictEqual('2')
        expect($('#active-contacts .moj-pagination__item--dots').text().trim()).toStrictEqual('…')
        expect($('#active-contacts .moj-pagination__link:eq(1)').text().trim()).toStrictEqual('5')
        expect($('#active-contacts .moj-pagination__link:eq(2)').text().trim()).toContain('Next')
      })

      it('should hide next link when last page is selected', async () => {
        // Given
        auditService.logPageView.mockResolvedValue(null)
        prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
        const actviveResponseList = {
          ...contactListResponse,
          numberOfElements: 50,
          totalElements: 50,
          totalPages: 5,
          first: false,
          last: true,
          number: 1,
        }
        contactsService.getPrisonerContacts.mockResolvedValue({ ...actviveResponseList } as PrisonerContactSummaryPage)

        // When
        const response = await request(app).get(
          `/prisoner/A462DZ/contacts/list/${journeyId}?page=0&tab=active-contacts#active-contacts`,
        )
        const $ = cheerio.load(response.text)

        // Then
        expect(response.status).toEqual(200)
        expect($('[data-qa=active-list]').hasClass('govuk-tabs__list-item--selected')).toBe(true)
        expect($('[data-qa=inactive-list]').hasClass('govuk-tabs__list-item--selected')).toBe(false)
        expect($('.moj-pagination')).toBeDefined()
        expect($('#active-contacts .moj-pagination__link:eq(0)').text().trim()).toContain('Prev')
        expect($('#active-contacts .moj-pagination__link:eq(1)').text().trim()).toStrictEqual('1')
        expect($('#active-contacts .moj-pagination__item--active').text().trim()).toStrictEqual('2')
        expect($('#active-contacts .moj-pagination__link:eq(2)').text().trim()).toStrictEqual('3')
        expect($('#active-contacts .moj-pagination__item--dots').text().trim()).toStrictEqual('…')
        expect($('#active-contacts .moj-pagination__link:eq(3)').text().trim()).toStrictEqual('5')
      })
    })

    describe('Inactive', () => {
      it('should render pagination for inactive contacts list', async () => {
        // Given
        auditService.logPageView.mockResolvedValue(null)
        prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
        contactsService.getPrisonerContacts.mockResolvedValue({ ...contactListResponse } as PrisonerContactSummaryPage)

        // When
        const response = await request(app).get(
          `/prisoner/A462DZ/contacts/list/${journeyId}?page=54&tab=inactive-contacts#inactive-contacts`,
        )
        const $ = cheerio.load(response.text)

        // Then
        expect(response.status).toEqual(200)
        expect($('[data-qa=active-list]').hasClass('govuk-tabs__list-item--selected')).toBe(false)
        expect($('[data-qa=inactive-list]').hasClass('govuk-tabs__list-item--selected')).toBe(true)
        expect($('.moj-pagination__item').text().trim()).toContain('1')
        expect($('.moj-pagination__item').text().trim()).toContain('2')
        expect($('.moj-pagination__item--dots').text().trim()).toContain('…')
        expect($('.moj-pagination__item').text().trim()).toContain('55')
        expect($('.moj-pagination__item').text().trim()).not.toContain('56')
      })

      it('should hide previous link when page equal or greater than 1 is selected', async () => {
        // Given
        auditService.logPageView.mockResolvedValue(null)
        prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
        const inactviveResponseList = {
          ...contactListResponse,
          numberOfElements: 50,
          totalElements: 50,
          totalPages: 5,
          first: true,
          last: false,
          number: 0,
        }
        contactsService.getPrisonerContacts.mockResolvedValue({
          ...inactviveResponseList,
        } as PrisonerContactSummaryPage)

        // When
        const response = await request(app).get(
          `/prisoner/A462DZ/contacts/list/${journeyId}?page=54&tab=inactive-contacts#inactive-contacts`,
        )
        const $ = cheerio.load(response.text)

        // Then
        expect(response.status).toEqual(200)
        expect($('[data-qa=active-list]').hasClass('govuk-tabs__list-item--selected')).toBe(false)
        expect($('[data-qa=inactive-list]').hasClass('govuk-tabs__list-item--selected')).toBe(true)
        expect($('.moj-pagination')).toBeDefined()
        expect($('#inactive-contacts .moj-pagination__item--active').text().trim()).toStrictEqual('1')
        expect($('#inactive-contacts .moj-pagination__link:eq(0)').text().trim()).toStrictEqual('2')
        expect($('#inactive-contacts .moj-pagination__item--dots').text().trim()).toStrictEqual('…')
        expect($('#inactive-contacts .moj-pagination__link:eq(1)').text().trim()).toStrictEqual('5')
        expect($('#inactive-contacts .moj-pagination__link:eq(2)').text().trim()).toContain('Next')
      })

      it('should hide next link when last page is selected', async () => {
        // Given
        auditService.logPageView.mockResolvedValue(null)
        prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
        const inactviveResponseList = {
          ...contactListResponse,
          numberOfElements: 50,
          totalElements: 50,
          totalPages: 5,
          first: false,
          last: true,
          number: 1,
        }
        contactsService.getPrisonerContacts.mockResolvedValue({
          ...inactviveResponseList,
        } as PrisonerContactSummaryPage)

        // When
        const response = await request(app).get(
          `/prisoner/A462DZ/contacts/list/${journeyId}?page=54&tab=inactive-contacts#inactive-contacts`,
        )
        const $ = cheerio.load(response.text)

        // Then
        expect(response.status).toEqual(200)
        expect($('[data-qa=active-list]').hasClass('govuk-tabs__list-item--selected')).toBe(false)
        expect($('[data-qa=inactive-list]').hasClass('govuk-tabs__list-item--selected')).toBe(true)
        expect($('.moj-pagination')).toBeDefined()
        expect($('#inactive-contacts .moj-pagination__link:eq(0)').text().trim()).toContain('Prev')
        expect($('#inactive-contacts .moj-pagination__link:eq(1)').text().trim()).toStrictEqual('1')
        expect($('#inactive-contacts .moj-pagination__item--active').text().trim()).toStrictEqual('2')
        expect($('#inactive-contacts .moj-pagination__link:eq(2)').text().trim()).toStrictEqual('3')
        expect($('#inactive-contacts .moj-pagination__item--dots').text().trim()).toStrictEqual('…')
        expect($('#inactive-contacts .moj-pagination__link:eq(3)').text().trim()).toStrictEqual('5')
      })
    })
  })

  describe('GET /prisoner/:prisonerNumber/contacts/list', () => {
    it('should render the contacts list for a prisoner without a journey', async () => {
      const classes = '#active-contacts > .govuk-table > .govuk-table__body > .govuk-table__row >'
      auditService.logPageView.mockResolvedValue(null)
      const contactsList: PrisonerContactSummary = [
        {
          prisonerContactId: 100,
          contactId: 200,
          prisonerNumber: 'G9381UV',
          lastName: 'Adams',
          firstName: 'Claire',
          middleNames: '',
          dateOfBirth: new Date('1973-01-10'),
          relationshipCode: 'code here',
          relationshipDescription: 'Friend',
          flat: '1',
          property: 'Property',
          street: '123 High Street',
          area: 'Mayfair',
          cityCode: 'LON',
          cityDescription: 'London',
          countyCode: 'LON',
          countyDescription: 'Greater London',
          postCode: 'W1 1AA',
          countryCode: 'ENG',
          countryDescription: 'England',
          approvedVisitor: true,
          nextOfKin: true,
          emergencyContact: true,
          awareOfCharges: true,
          comments: 'comments here',
        },
      ]

      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getPrisonerContacts.mockResolvedValue({ content: contactsList } as PrisonerContactSummaryPage)

      const response = await request(app).get(`/prisoner/A462DZ/contacts/list`)
      const $ = cheerio.load(response.text)

      // Prisoner
      expect($('[data-qa="mini-profile-person-profile-link"]').text()).toStrictEqual('Smith, John')
      expect($('[data-qa="mini-profile-prisoner-number"]').text()).toStrictEqual('A1234BC')
      expect($('[data-qa="mini-profile-dob"]').text()).toStrictEqual('2 April 1975')
      expect($('[data-qa="mini-profile-prison-name"]').text()).toStrictEqual('HMP Hewell')
      expect($('[data-qa="mini-profile-cell-location"]').text()).toStrictEqual('1-1-C-028')

      // Button
      expect($('.govuk-button').text()).toContain('Add prisoner contact')

      // Contact List Table
      expect($('.govuk-heading-l').text()).toStrictEqual('Contacts for Smith, John')
      expect($('.govuk-table__header').eq(0).text()).toStrictEqual('Name')
      expect($('.govuk-table__header').eq(1).text()).toStrictEqual('Date of birth')

      expect($('.govuk-table__header').eq(2).text()).toStrictEqual('Address')
      expect($('.govuk-table__header').eq(3).text()).toStrictEqual('Relationship to prisoner')
      expect($('.govuk-table__header').eq(4).text()).toStrictEqual('Emergency contact')
      expect($('.govuk-table__header').eq(5).text()).toStrictEqual('Next of kin')
      expect($('.govuk-table__header').eq(6).text()).toStrictEqual('Approved')

      expect($(`${classes} :nth-child(1) > a`).text()).toContain('Adams, Claire')
      expect($(`${classes} :nth-child(2)`).text()).toContain('10 January 1973')
      expect($(`${classes} :nth-child(2)`).text()).toContain('(52 years old)')
      expect($(`${classes} :nth-child(3)`).text()).toContain('Flat 1,')
      expect($(`${classes} :nth-child(3)`).text()).toContain('Property')
      expect($(`${classes} :nth-child(3)`).text()).toContain('123 High Street')
      expect($(`${classes} :nth-child(3)`).text()).toContain('Mayfair')
      expect($(`${classes} :nth-child(3)`).text()).toContain('London')
      expect($(`${classes} :nth-child(3)`).text()).toContain('Greater London')
      expect($(`${classes} :nth-child(3)`).text()).toContain('W1 1AA')
      expect($(`${classes} :nth-child(3)`).text()).toContain('England')
      expect($(`${classes} :nth-child(4)`).text()).toContain('Friend')
      expect($(`${classes} :nth-child(5)`).text()).toContain('Yes')
      expect($(`${classes} :nth-child(6)`).text()).toContain('Yes')
      expect($(`${classes} :nth-child(7)`).text()).toContain('Yes')

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.LIST_CONTACTS_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
    })
  })
})
