import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import AddContactJourney = journeys.AddContactJourney
import { components } from '../../../../@types/contactsApi'

type LinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/restrictionsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()
const restrictionsService = MockedService.RestrictionsService()

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
  postcode: '',
  primaryAddress: false,
  mailFlag: false,
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
      restrictionsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
    },
  })
  referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Mr')
  restrictionsService.getGlobalRestrictions.mockResolvedValue([])
  contactsService.getLinkedPrisoners.mockResolvedValue({ content: [], page: { totalElements: 0 } })
})

afterEach(() => {
  jest.resetAllMocks()
})
describe('Contact details', () => {
  describe('GET /prisoner/:prisonerNumber/contacts/EXISTING/confirmation/:journeyId?contactId=', () => {
    it('should render confirmation page', async () => {
      // Given
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
          { ...blankAddress, property: 'no start date', primaryAddress: false, mailFlag: false },
          {
            ...blankAddress,
            property: 'latest start date',
            primaryAddress: false,
            mailFlag: false,
            startDate: '2024-01-01',
          },
        ],
      })

      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.confirm-address-value').text().trim()).toStrictEqual('latest start date')
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
            startDate: '2024-01-01',
            createdTime: '2024-01-01',
          },
        ],
      })

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
    ])('should show gender if question was answered', async (genderCode: string, genderDescription: string) => {
      // Given
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue(TestData.contact({ genderCode, genderDescription }))
      contactsService.getContact.mockResolvedValue(TestData.contact({ genderCode, genderDescription }))
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
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue(TestData.contact())
      contactsService.getContact.mockResolvedValue({
        ...TestData.contact({}),
        gender: undefined,
        genderDescription: undefined,
      })
      referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('')
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
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact())
    existingJourney.mode = 'EXISTING'
  })
  describe('Global Restrictions', () => {
    describe('GET /prisoner/:prisonerNumber/contacts/add/confirmation/:journeyId?#restrictions', () => {
      it('should render restrictions tab', async () => {
        // Given
        restrictionsService.getGlobalRestrictions.mockResolvedValue([TestData.getContactRestrictionDetails()])

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

        const restrictionTitle = $('[data-qa="CONTACT_GLOBAL-title"]')
        expect(restrictionTitle.text()).toStrictEqual('Global restrictions')
        const restrictionsTable = restrictionTitle.next()
        expect(restrictionsTable.find('caption').text().trim()).toStrictEqual(
          'These restrictions apply to contact Jones Mason across the whole prison estate.',
        )

        expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions (1)')

        expect($('[data-qa="CONTACT_GLOBAL-1-type-value"]').text().trim()).toStrictEqual('Child Visitors to be Vetted')
        expect($('[data-qa="CONTACT_GLOBAL-1-start-date-value"]').text().trim()).toStrictEqual('01/01/2024')
        expect($('[data-qa="CONTACT_GLOBAL-1-expiry-date-value"]').text().trim()).toStrictEqual('01/08/2050')
        expect($('[data-qa="CONTACT_GLOBAL-1-entered-by-value"]').text().trim()).toStrictEqual('User One')
        expect($('[data-qa="CONTACT_GLOBAL-1-comments-value"]').text().trim()).toStrictEqual('Keep an eye')
      })

      it('should render restrictions tab with expired restrictions', async () => {
        // Given
        restrictionsService.getGlobalRestrictions.mockResolvedValue([
          TestData.getContactRestrictionDetails({
            restrictionTypeDescription: 'Child Visitors to be Vetted',
            enteredByDisplayName: 'User One',
            expiryDate: '2024-08-01',
          }),
        ])

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

        // Then
        const $ = cheerio.load(response.text)

        expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions (1)')

        const titleText = $('[data-qa="CONTACT_GLOBAL-1-type-value"]').text().trim()
        expect(titleText).toContain('Child Visitors to be Vetted')
        expect(titleText).toContain('(expired)')
        expect($('[data-qa="CONTACT_GLOBAL-1-start-date-value"]').text().trim()).toStrictEqual('01/01/2024')
        expect($('[data-qa="CONTACT_GLOBAL-1-expiry-date-value"]').text().trim()).toStrictEqual('01/08/2024')
        expect($('[data-qa="CONTACT_GLOBAL-1-entered-by-value"]').text().trim()).toStrictEqual('User One')
        expect($('[data-qa="CONTACT_GLOBAL-1-comments-value"]').text().trim()).toStrictEqual('Keep an eye')
      })

      it('should render restrictions tab with no restrictions message', async () => {
        // Given
        restrictionsService.getGlobalRestrictions.mockResolvedValue([])

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

        // Then
        const $ = cheerio.load(response.text)

        expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions (0)')
        expect($('.restrictions-caption-CONTACT_GLOBAL').text().trim()).toContain(
          'No restrictions apply to contact Jones Mason across the whole prison estate.',
        )
      })

      it('should show not entered text for expiry date and comments when not available', async () => {
        // Given
        restrictionsService.getGlobalRestrictions.mockResolvedValue([
          TestData.getContactRestrictionDetails({ expiryDate: '', comments: '' }),
        ])

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

        // Then
        const $ = cheerio.load(response.text)
        expect($('[data-qa="CONTACT_GLOBAL-1-expiry-date-value"]').text().trim()).toStrictEqual('Not provided')
        expect($('[data-qa="CONTACT_GLOBAL-1-comments-value"]').text().trim()).toStrictEqual('Not provided')
      })

      it('should not show manage restrictions link', async () => {
        // Given
        restrictionsService.getGlobalRestrictions.mockResolvedValue([
          TestData.getContactRestrictionDetails({ expiryDate: '', comments: '' }),
        ])

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

        // Then
        const $ = cheerio.load(response.text)

        expect($('[data-qa=manage-restriction-link]').length).toBe(0)
      })
    })
  })

  describe('Linked prisoners tab', () => {
    it('should render linked prisoners tab with no results', async () => {
      // Given
      contactsService.getLinkedPrisoners.mockResolvedValue({ content: [], page: { totalElements: 0 } })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.linked-prisoners-tab-title').text().trim()).toStrictEqual('Linked prisoners (0)')
      expect($('[data-qa="no-linked-prisoners-message"]').text().trim()).toStrictEqual('No linked prisoners recorded.')
    })

    it('should render linked prisoners', async () => {
      // Given
      const linkedPrisoners: LinkedPrisonerDetails[] = [
        {
          prisonerNumber: 'A1234BC',
          lastName: 'Last',
          firstName: 'First',
          prisonId: 'BXI',
          prisonName: 'Brixton (HMP)',
          prisonerContactId: 2,
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social/Family',
          relationshipToPrisonerCode: 'MOT',
          relationshipToPrisonerDescription: 'Mother',
          isRelationshipActive: true,
        },
        {
          prisonerNumber: 'A1234BC',
          lastName: 'Last',
          firstName: 'First',
          prisonId: 'BXI',
          prisonName: 'Brixton (HMP)',
          prisonerContactId: 3,
          relationshipTypeCode: 'O',
          relationshipTypeDescription: 'Official',
          relationshipToPrisonerCode: 'DR',
          relationshipToPrisonerDescription: 'Doctor',
          isRelationshipActive: false,
        },
        {
          prisonerNumber: 'X7896YZ',
          lastName: 'Smith',
          firstName: 'John',
          middleNames: 'Middle Names',
          prisonId: 'EXE',
          prisonName: 'Exeter (HMP)',
          prisonerContactId: 1,
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social/Family',
          relationshipToPrisonerCode: 'FRI',
          relationshipToPrisonerDescription: 'Friend',
          isRelationshipActive: true,
        },
        {
          prisonerNumber: 'Z7896YZ',
          lastName: 'Smith',
          firstName: 'John',
          middleNames: 'Middle Names',
          prisonId: 'EXE',
          prisonName: 'Exeter (HMP)',
          prisonerContactId: 4,
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social/Family',
          relationshipToPrisonerCode: 'UNC',
          relationshipToPrisonerDescription: 'Uncle',
          isRelationshipActive: true,
        },
      ]

      contactsService.getLinkedPrisoners.mockResolvedValue({
        content: linkedPrisoners,
        page: { totalElements: 4 },
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)

      // Then
      const $ = cheerio.load(response.text)

      // Should include all relationships in the count if a prisoner has more than one relationship to the contact
      expect($('.linked-prisoners-tab-title').text().trim()).toStrictEqual('Linked prisoners (4)')
      const tableRows = $('.govuk-table__row')
      const firstRowColumns = tableRows.eq(1).find('td')
      expect(firstRowColumns.eq(0).text()).toContain('Last, First')
      expect(firstRowColumns.eq(0).text()).toContain('A1234BC')
      expect(firstRowColumns.eq(1).text()).toStrictEqual('Brixton (HMP)')
      expect(firstRowColumns.eq(2).text()).toStrictEqual('Social/Family')
      expect(firstRowColumns.eq(3).text()).toStrictEqual('Mother')
      expect(firstRowColumns.eq(4).text()).toStrictEqual('Active')

      const secondRowColumns = tableRows.eq(2).find('td')
      expect(secondRowColumns.eq(0).text()).toContain('Last, First')
      expect(secondRowColumns.eq(0).text()).toContain('A1234BC')
      expect(secondRowColumns.eq(1).text()).toStrictEqual('Brixton (HMP)')
      expect(secondRowColumns.eq(2).text()).toStrictEqual('Official')
      expect(secondRowColumns.eq(3).text()).toStrictEqual('Doctor')
      expect(secondRowColumns.eq(4).text()).toStrictEqual('Inactive')

      const thirdRowColumns = tableRows.eq(3).find('td')
      expect(thirdRowColumns.eq(0).text()).toContain('Smith, John Middle Names')
      expect(thirdRowColumns.eq(0).text()).toContain('X7896YZ')
      expect(thirdRowColumns.eq(1).text()).toStrictEqual('Exeter (HMP)')
      expect(thirdRowColumns.eq(2).text()).toStrictEqual('Social/Family')
      expect(thirdRowColumns.eq(3).text()).toStrictEqual('Friend')
      expect(thirdRowColumns.eq(4).text()).toStrictEqual('Active')

      const fourthRowColumns = tableRows.eq(4).find('td')
      expect(fourthRowColumns.eq(0).text()).toContain('Smith, John Middle Names')
      expect(fourthRowColumns.eq(0).text()).toContain('Z7896YZ')
      expect(fourthRowColumns.eq(1).text()).toStrictEqual('Exeter (HMP)')
      expect(fourthRowColumns.eq(2).text()).toStrictEqual('Social/Family')
      expect(fourthRowColumns.eq(3).text()).toStrictEqual('Uncle')
      expect(fourthRowColumns.eq(4).text()).toStrictEqual('Active')
    })
  })

  it('should show pagination if more than 10', async () => {
    const linkedPrisoners: LinkedPrisonerDetails[] = Array(10)
      .fill(0)
      .map(
        (_, i) =>
          ({
            prisonerNumber: `A${i}BC`,
            lastName: `Last`,
            firstName: 'First',
            prisonId: 'BXI',
            prisonName: 'Brixton (HMP)',
            prisonerContactId: i,
            relationshipTypeCode: 'S',
            relationshipTypeDescription: 'Social/Family',
            relationshipToPrisonerCode: 'MOT',
            relationshipToPrisonerDescription: 'Mother',
            isRelationshipActive: true,
          }) as LinkedPrisonerDetails,
      )

    contactsService.getLinkedPrisoners.mockResolvedValue({ content: linkedPrisoners, page: { totalElements: 240 } })
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(TestData.contact({ id: 1 }))
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}`)
    const $ = cheerio.load(response.text)

    // Should include all relationships in the count if a prisoner has more than one relationship to the contact
    expect($('.linked-prisoners-tab-title').text().trim()).toStrictEqual('Linked prisoners (240)')

    linkedPrisoners.forEach(linkedPrisoner => {
      const rowColumns = $('.govuk-table__row')
        .eq(linkedPrisoner.prisonerContactId + 1)
        .find('td')
      expect(rowColumns.eq(0).text()).toContain(linkedPrisoner.prisonerNumber)
    })
    expect($('.moj-pagination')).toHaveLength(2)
    expect(contactsService.getLinkedPrisoners).toHaveBeenCalledWith(1, 0, 10, user)
  })

  it('should load the relevant page if not default', async () => {
    const linkedPrisoners: LinkedPrisonerDetails[] = Array(10)
      .fill(0)
      .map(
        (_, i) =>
          ({
            prisonerNumber: `A${i}BC`,
            lastName: `Last`,
            firstName: 'First',
            prisonId: 'BXI',
            prisonName: 'Brixton (HMP)',
            prisonerContactId: i + 50,
            relationshipTypeCode: 'S',
            relationshipTypeDescription: 'Social/Family',
            relationshipToPrisonerCode: 'MOT',
            relationshipToPrisonerDescription: 'Mother',
            isRelationshipActive: true,
          }) as LinkedPrisonerDetails,
      )

    contactsService.getLinkedPrisoners.mockResolvedValue({ content: linkedPrisoners, page: { totalElements: 240 } })
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(TestData.contact({ id: 1 }))
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/confirmation/${journeyId}?linkedPrisonerPage=2`,
    )
    const $ = cheerio.load(response.text)

    // Should include all relationships in the count if a prisoner has more than one relationship to the contact
    expect($('.linked-prisoners-tab-title').text().trim()).toStrictEqual('Linked prisoners (240)')

    linkedPrisoners.forEach(linkedPrisoner => {
      const rowColumns = $('.govuk-table__row')
        .eq(linkedPrisoner.prisonerContactId - 49)
        .find('td')
      expect(rowColumns.eq(0).text()).toContain(linkedPrisoner.prisonerNumber)
    })
    expect($('.moj-pagination')).toHaveLength(2)
    expect(contactsService.getLinkedPrisoners).toHaveBeenCalledWith(
      1,
      1 /* page number is 0 indexed so page 2 = page 1 API */,
      10,
      user,
    )
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
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]!.isContactConfirmed).toStrictEqual('YES')
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
    expect(session.addContactJourneys![journeyId]!.isContactConfirmed).toBeUndefined()
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
    expect(session.addContactJourneys![journeyId]!.isContactConfirmed).toStrictEqual(undefined)
  })
})
