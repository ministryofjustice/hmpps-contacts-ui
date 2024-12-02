import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import ReferenceDataService from '../../../../services/referenceDataService'
import TestData from '../../../testutils/testData'
import AddContactJourney = journeys.AddContactJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney
const blankAddress = TestData.address({
  flat: '',
  property: '',
  street: '',
  area: '',
  cityCode: '',
  cityDescription: '',
  countyCode: '',
  countyDescription: '',
  countryCode: '',
  countryDescription: '',
  primaryAddress: false,
  mailFlag: false,
  startDate: null,
  endDate: null,
})
beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { url: '/foo-bar' },
    mode: 'EXISTING',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
    },
  })
  referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Mr')
  contactsService.getGlobalContactRestrictions.mockResolvedValue([])
})

afterEach(() => {
  jest.resetAllMocks()
})
describe('Contact details', () => {
  describe('GET /prisoner/:prisonerNumber/contacts/EXISTING/confirmation/:journeyId?contactId=', () => {
    it('should render confirmation page', async () => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue(TestData.contact())
      contactsService.getContact.mockResolvedValue(TestData.contact())
      existingJourney.mode = 'EXISTING'

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_CONFIRMATION_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
      const $ = cheerio.load(response.text)

      expect($('.govuk-heading-l').text()).toStrictEqual('Is this the right person to add as a contact for John Smith?')
      expect($('.confirm-DL-value').text().trim()).toStrictEqual('LAST-87736799M')
      expect($('.confirm-PASS-value').text().trim()).toStrictEqual('425362965Issuing authority - UK passport office')
      expect($('.confirm-NINO-value').text().trim()).toStrictEqual('06/614465M')
    })

    it('should show the primary address if there is one', async () => {
      // Given
      const contact = TestData.contact({
        addresses: [
          { ...blankAddress, property: 'primary', primaryAddress: true, mailFlag: false },
          { ...blankAddress, property: 'secondary', primaryAddress: false, mailFlag: true },
        ],
      })

      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.confirm-address-value').text().trim()).toStrictEqual('primary')
      expect($('.most-relevant-address-label').text().trim()).toStrictEqual('Primary')
    })

    it('should label as primary and mail', async () => {
      // Given
      const contact = TestData.contact({
        addresses: [{ ...blankAddress, property: 'primary', primaryAddress: true, mailFlag: true }],
      })

      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.confirm-address-value').text().trim()).toStrictEqual('primary')
      expect($('.most-relevant-address-label').text().trim()).toStrictEqual('Primary and mail')
    })

    it('should use mail address if no primary', async () => {
      // Given
      const contact = TestData.contact({
        addresses: [
          { ...blankAddress, property: 'nothing', primaryAddress: false, mailFlag: false },
          { ...blankAddress, property: 'mail', primaryAddress: false, mailFlag: true },
        ],
      })

      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.confirm-address-value').text().trim()).toStrictEqual('mail')
      expect($('.most-relevant-address-label').text().trim()).toStrictEqual('Mail')
    })

    it('should use latest start date if no primary or mail', async () => {
      // Given
      const contact = TestData.contact({
        addresses: [
          {
            ...blankAddress,
            property: 'earliest start date',
            primaryAddress: false,
            mailFlag: false,
            startDate: '2020-01-01',
          },
          { ...blankAddress, property: 'no start date', primaryAddress: false, mailFlag: false, startDate: null },
          {
            ...blankAddress,
            property: 'latest start date',
            primaryAddress: false,
            mailFlag: false,
            startDate: '2024-01-01',
          },
        ],
      })

      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.confirm-address-value').text().trim()).toStrictEqual('latest start date')
      expect($('.most-relevant-address-label').text().trim()).toStrictEqual('')
    })

    it('should use latest created if no primary, mail or start date', async () => {
      // Given
      const contact = TestData.contact({
        addresses: [
          {
            ...blankAddress,
            property: 'earliest created date',
            primaryAddress: false,
            mailFlag: false,
            startDate: null,
            createdTime: '2020-01-01',
          },
          {
            ...blankAddress,
            property: 'latest created date',
            primaryAddress: false,
            mailFlag: false,
            startDate: null,
            createdTime: '2024-01-01',
          },
        ],
      })

      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.confirm-address-value').text().trim()).toStrictEqual('latest created date')
      expect($('.most-relevant-address-label').text().trim()).toStrictEqual('')
    })

    it('should not show if has an end date even if primary', async () => {
      // Given
      const contact = TestData.contact({
        addresses: [
          {
            ...blankAddress,
            property: 'would be this one if no end date',
            primaryAddress: true,
            mailFlag: true,
            startDate: '2000-01-01',
            endDate: '2020-01-01',
          },
          {
            ...blankAddress,
            property: 'no end date',
            primaryAddress: false,
            mailFlag: false,
            startDate: null,
            createdTime: '2024-01-01',
          },
        ],
      })

      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.confirm-address-value').text().trim()).toStrictEqual('no end date')
      expect($('.most-relevant-address-label').text().trim()).toStrictEqual('')
    })

    it('should show not provided if no relevant addresses', async () => {
      // Given
      const contact = TestData.contact({
        addresses: [
          {
            ...blankAddress,
            property: 'would be this one if no end date',
            primaryAddress: true,
            mailFlag: true,
            startDate: '2000-01-01',
            endDate: '2020-01-01',
          },
        ],
      })

      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.confirm-address-value').text().trim()).toStrictEqual('')
      expect($('.most-relevant-address-label').text().trim()).toStrictEqual('')
      expect($('.addresses-not-provided').text().trim()).toStrictEqual('Not provided')
    })

    it('should show email addresses in alphabetic order', async () => {
      const contact = TestData.contact({
        emailAddresses: [
          TestData.getContactEmailDetails('bravo@example.com', 1),
          TestData.getContactEmailDetails('alpha@example.com', 2),
        ],
      })

      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contact)

      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      const $ = cheerio.load(response.text)
      const emailContainer = $('.confirm-email-addresses-value')

      const emails = emailContainer
        .find('p')
        .map((_, el) => $(el).text().trim())
        .get()

      expect(emails).toEqual(['alpha@example.com', 'bravo@example.com'])
    })

    it.each([
      ['M', 'Male'],
      ['F', 'Female'],
      ['NK', 'Not Known / Not Recorded'],
      ['NS', 'Specified (Indeterminate)'],
    ])('should show gender if question was answered', async (gender: string, genderDescription: string) => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue(TestData.contact({ gender, genderDescription }))
      contactsService.getContact.mockResolvedValue(TestData.contact({ gender, genderDescription }))
      referenceDataService.getReferenceDescriptionForCode.mockResolvedValue(genderDescription)
      existingJourney.mode = 'EXISTING'

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_CONFIRMATION_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
      const $ = cheerio.load(response.text)
      expect($('.confirm-gender-value').text().trim()).toStrictEqual(genderDescription)
    })

    it('should show "not provided" for gender if question was not answered', async () => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue(TestData.contact())
      contactsService.getContact.mockResolvedValue(TestData.contact({ gender: null, genderDescription: null }))
      referenceDataService.getReferenceDescriptionForCode.mockResolvedValue(null)
      existingJourney.mode = 'EXISTING'

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_CONFIRMATION_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
      const $ = cheerio.load(response.text)
      expect($('.confirm-gender-value').text().trim()).toStrictEqual('Not provided')
    })
  })
})

describe('Restrictions', () => {
  beforeEach(() => {
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact())
    existingJourney.mode = 'EXISTING'
  })
  describe('Global Restrictions', () => {
    describe('GET /prisoner/:prisonerNumber/contacts/add/confirmation/:journeyId?#restrictions', () => {
      it('should render restrictions tab', async () => {
        // Given
        contactsService.getGlobalContactRestrictions.mockResolvedValue([TestData.getContactRestrictionDetails()])

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

        // Then
        expect(response.status).toEqual(200)
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_CONFIRMATION_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
        const $ = cheerio.load(response.text)

        expect($('[data-qa="confim-title-value-top"]').text()).toStrictEqual(
          'Is this the right person to add as a contact for John Smith?',
        )

        expect($('[data-qa="confirm-contact-restriction-title"]').text()).toStrictEqual(
          'Global restrictions for contact Jones Mason',
        )

        expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions(1)')
        const titleText = $('.govuk-summary-card.restriction-1-card .govuk-summary-card__title').text().trim()

        expect(titleText).toStrictEqual('Child Visitors to be Vetted')
        expect($('.view-start-date-1-value').text().trim()).toStrictEqual('1 January 2024')
        expect($('.view-expiry-date-1-value').text().trim()).toStrictEqual('1 August 2050')
        expect($('.view-entered-by-1-value').text().trim()).toStrictEqual('USER1')
        expect($('.view-comment-1-value').text().trim()).toStrictEqual('Keep an eye')
      })

      it('should render restrictions tab with expired restrictions', async () => {
        // Given
        contactsService.getGlobalContactRestrictions.mockResolvedValue([
          TestData.getContactRestrictionDetails({ expiryDate: '2024-08-01' }),
        ])

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

        // Then
        const $ = cheerio.load(response.text)

        expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions(1)')

        const cardTitle = $('.govuk-summary-card.restriction-1-card .govuk-summary-card__title').text().trim()

        expect(cardTitle).toStrictEqual('Child Visitors to be Vetted (expired)')
        expect($('.view-start-date-1-value').text().trim()).toStrictEqual('1 January 2024')
        expect($('.view-expiry-date-1-value').text().trim()).toStrictEqual('1 August 2024')
        expect($('.view-entered-by-1-value').text().trim()).toStrictEqual('USER1')
        expect($('.view-comment-1-value').text().trim()).toStrictEqual('Keep an eye')
      })

      it('should render restrictions tab with no restrictions message', async () => {
        // Given
        contactsService.getGlobalContactRestrictions.mockResolvedValue([])

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

        // Then
        const $ = cheerio.load(response.text)

        expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions(0)')
        expect($('[data-qa="restrictions-result-message"]').text().trim()).toStrictEqual(
          'No global restrictions recorded.',
        )
      })

      it('should show not entered text for expiry date and comments when not available', async () => {
        // Given
        contactsService.getGlobalContactRestrictions.mockResolvedValue([
          TestData.getContactRestrictionDetails({ expiryDate: '', comments: '' }),
        ])

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

        // Then
        const $ = cheerio.load(response.text)

        expect($('.view-expiry-date-1-value').text().trim()).toStrictEqual('Not provided')
        expect($('.view-comment-1-value').text().trim()).toStrictEqual('Not provided')
      })

      it('should sort restrictions based on startDate, with the most recent at the top. where multiple restrictions with the same date, sorted them by createdTime', async () => {
        // Given
        contactsService.getGlobalContactRestrictions.mockResolvedValue([
          TestData.getContactRestrictionDetails({
            startDate: '2024-01-02',
            createdTime: '2024-08-01T09:00:00.000000',
            restrictionTypeDescription: 'Third Card - with the one day oder than third record start date',
          }),
          TestData.getContactRestrictionDetails({
            startDate: '2024-01-01',
            createdTime: '2024-08-01T09:00:00.000000',
            restrictionTypeDescription: 'Last Card - as the oldest start date',
          }),
          TestData.getContactRestrictionDetails({
            startDate: '2024-01-03',
            createdTime: '2024-01-03T10:00:00.000000',
            restrictionTypeDescription:
              'Second Card - same start date as record below but one hour older in created date time',
          }),
          TestData.getContactRestrictionDetails({
            startDate: '2024-01-03',
            createdTime: '2024-01-03T11:00:00.000000',
            restrictionTypeDescription:
              'First Card - same start date as record above but one hour newer in created date time',
          }),
        ])

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

        // Then
        const $ = cheerio.load(response.text)

        expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions(4)')
        const cardTitles = $('.restrictions-cards-titles')
        const titles = cardTitles.map((i, el) => $(el).text()).get()

        expect(titles[0].trim()).toContain('First Card')
        expect(titles[1].trim()).toContain('Second Card')
        expect(titles[2].trim()).toContain('Third Card')
        expect(titles[3].trim()).toContain('Last Card')
      })
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/add/confirmation/:journeyId?contactId=', () => {
  it('should pass validation when "Yes, this is the right person" is selected', async () => {
    // Given
    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)
      .type('form')
      .send({ isContactConfirmed: 'YES' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship/${journeyId}`)

    // Then
    expect(session.addContactJourneys[journeyId].isContactConfirmed).toStrictEqual('YES')
  })

  it('should pass validation when "No, this is not the right person" is selected and return to search', async () => {
    // Given
    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)
      .type('form')
      .send({ isContactConfirmed: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

    // Then
    expect(session.addContactJourneys[journeyId].isContactConfirmed).toBeUndefined()
  })

  it('should not pass validation when no option is selected', async () => {
    // Given
    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)
      .type('form')
      .send({ isContactConfirmed: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

    // Then
    expect(session.addContactJourneys[journeyId].isContactConfirmed).toStrictEqual(undefined)
  })
})
