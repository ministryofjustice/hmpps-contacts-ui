import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { Page } from '../../../../services/auditService'
import { HmppsUser } from '../../../../interfaces/hmppsUser'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/restrictionsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const restrictionsService = MockedService.RestrictionsService()

let app: Express
const prisonerNumber = 'A1234BC'
let currentUser = authorisingUser

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      restrictionsService,
    },
    userSupplier: () => currentUser,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/relationship/:prisonerContactId/edit-restrictions', () => {
  beforeEach(() => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(
      TestData.prisoner({ firstName: 'Incarcerated', lastName: 'Individual' }),
    )
    contactsService.getContact.mockResolvedValue(
      TestData.contact({
        firstName: 'First',
        lastName: 'Last',
        middleNames: 'Middle Names',
      }),
    )
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
    restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
      prisonerContactRestrictions: [],
      contactGlobalRestrictions: [],
    })
  })

  it('should audit page view', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-restrictions`,
    )
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.EDIT_RESTRICTIONS_PAGE, {
      who: authorisingUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '1',
        prisonerContactId: '99',
        prisonerNumber: 'A1234BC',
      },
    })
    expect(contactsService.getContact).toHaveBeenCalledWith(1, authorisingUser)
  })

  it.each([
    [
      'Add restrictions for First Middle Names Last',
      { prisonerContactRestrictions: [], contactGlobalRestrictions: [] },
    ],
    [
      'Add or update restrictions for First Middle Names Last',
      { prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails()], contactGlobalRestrictions: [] },
    ],
    [
      'Add or update restrictions for First Middle Names Last',
      { prisonerContactRestrictions: [], contactGlobalRestrictions: [TestData.getContactRestrictionDetails()] },
    ],
  ])('should have correct navigation (%s, %j)', async (expectedTitle, restrictions) => {
    restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue(restrictions)

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-restrictions`,
    )
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Add or update restrictions for a contact linked to a prisoner - DPS')
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual(expectedTitle)
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contacts')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/99',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to contact record')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/99',
    )
  })

  describe('Restrictions', () => {
    beforeEach(() => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue({ content: [TestData.contactSearchResultItem()] })
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
    })
    it('should render restrictions tab with global and prisoner-contact restrictions', async () => {
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails()],
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({
            contactRestrictionId: 2,
            startDate: '2024-01-02',
            createdTime: '2024-08-01T09:00:00.000000',
            restrictionType: 'CCTV',
            restrictionTypeDescription: 'Keep under CCTV supervision',
          }),
        ],
      })
      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-restrictions`,
      )

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.restrictions-caption-PRISONER_CONTACT').text()).toStrictEqual(
        'These restrictions apply to the relationship between prisoner John Smith and contact Jones Mason.',
      )
      expect($('.restrictions-caption-CONTACT_GLOBAL').text()).toStrictEqual(
        'These restrictions apply to contact Jones Mason across the whole prison estate.',
      )

      const relationshipRestrictionTitleText = $('[data-qa="PRISONER_CONTACT-1-type-value"]').text().trim()
      expect(relationshipRestrictionTitleText).toContain('Child Visitors to be Vetted')
      expect($('[data-qa="PRISONER_CONTACT-1-start-date-value"]').text().trim()).toStrictEqual('1/1/2024')
      expect($('[data-qa="PRISONER_CONTACT-1-expiry-date-value"]').text().trim()).toStrictEqual('1/8/2050')
      expect($('[data-qa="PRISONER_CONTACT-1-entered-by-value"]').text().trim()).toStrictEqual('User One')
      expect($('[data-qa="PRISONER_CONTACT-1-comments-value"]').text().trim()).toStrictEqual('Keep an eye')

      const globalRestrictionTitleText = $('[data-qa="CONTACT_GLOBAL-2-type-value"]').text().trim()
      expect(globalRestrictionTitleText).toContain('Keep under CCTV supervision')
      expect($('[data-qa="CONTACT_GLOBAL-2-start-date-value"]').text().trim()).toStrictEqual('2/1/2024')
      expect($('[data-qa="CONTACT_GLOBAL-2-expiry-date-value"]').text().trim()).toStrictEqual('1/8/2050')
      expect($('[data-qa="CONTACT_GLOBAL-2-entered-by-value"]').text().trim()).toStrictEqual('User One')
      expect($('[data-qa="CONTACT_GLOBAL-2-comments-value"]').text().trim()).toStrictEqual('Keep an eye')
    })

    it('should render global restrictions tab with expired restrictions', async () => {
      // Given
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({
            restrictionTypeDescription: 'Child Visitors to be Vetted',
            expiryDate: '2024-08-01',
          }),
        ],
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-restrictions`,
      )

      // Then
      const $ = cheerio.load(response.text)

      const globalRestrictionTitleText = $('[data-qa="CONTACT_GLOBAL-1-type-value"]').text().trim()
      expect(globalRestrictionTitleText).toContain('Child Visitors to be Vetted')
      expect(globalRestrictionTitleText).toContain('(expired)')
    })

    it('should render prisoner contact restrictions tab with expired restrictions', async () => {
      // Given
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [],
        prisonerContactRestrictions: [
          TestData.getPrisonerContactRestrictionDetails({
            restrictionTypeDescription: 'Child Visitors to be Vetted',
            expiryDate: '2024-08-01',
          }),
        ],
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-restrictions`,
      )

      // Then
      const $ = cheerio.load(response.text)

      const relationshipRestrictionTitleText = $('[data-qa="PRISONER_CONTACT-1-type-value"]').text().trim()
      expect(relationshipRestrictionTitleText).toContain('Child Visitors to be Vetted')
      expect(relationshipRestrictionTitleText).toContain('(expired)')
    })

    it('should render restrictions tab with no restrictions message', async () => {
      // Given
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [],
        prisonerContactRestrictions: [],
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-restrictions`,
      )

      // Then
      const $ = cheerio.load(response.text)

      expect($('.restrictions-caption-PRISONER_CONTACT').text()).toStrictEqual(
        'No restrictions apply to the relationship between prisoner John Smith and contact Jones Mason.',
      )
      expect($('.restrictions-caption-CONTACT_GLOBAL').text()).toStrictEqual(
        'No restrictions apply to contact Jones Mason across the whole prison estate.',
      )
    })

    it('should show not entered text for expiry date and comments when not available', async () => {
      // Given
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({ contactRestrictionId: 1, expiryDate: '', comments: '' }),
        ],
        prisonerContactRestrictions: [
          TestData.getPrisonerContactRestrictionDetails({
            prisonerContactRestrictionId: 2,
            expiryDate: '',
            comments: '',
          }),
        ],
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-restrictions`,
      )

      // Then
      const $ = cheerio.load(response.text)

      expect($('[data-qa="PRISONER_CONTACT-2-expiry-date-value"]').text().trim()).toStrictEqual('Not provided')
      expect($('[data-qa="PRISONER_CONTACT-2-comments-value"]').text().trim()).toStrictEqual('Not provided')

      expect($('[data-qa="CONTACT_GLOBAL-1-expiry-date-value"]').text().trim()).toStrictEqual('Not provided')
      expect($('[data-qa="CONTACT_GLOBAL-1-comments-value"]').text().trim()).toStrictEqual('Not provided')
    })

    it('should show add global and prisoner contact restriction links', async () => {
      // Given
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({ contactRestrictionId: 1, expiryDate: '', comments: '' }),
        ],
        prisonerContactRestrictions: [
          TestData.getPrisonerContactRestrictionDetails({
            prisonerContactRestrictionId: 2,
            expiryDate: '',
            comments: '',
          }),
        ],
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-restrictions`,
      )

      // Then
      const $ = cheerio.load(response.text)

      expect($('[data-qa=add-global-restriction-button]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/1/relationship/99/restriction/add/CONTACT_GLOBAL/start',
      )

      expect($('[data-qa=add-prisoner-contact-restriction-button]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/1/relationship/99/restriction/add/PRISONER_CONTACT/start',
      )
    })

    it('should show change restriction link', async () => {
      // Given
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({ contactRestrictionId: 1, expiryDate: '', comments: '' }),
        ],
        prisonerContactRestrictions: [
          TestData.getPrisonerContactRestrictionDetails({
            prisonerContactRestrictionId: 2,
            expiryDate: '',
            comments: '',
          }),
        ],
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/22/relationship/99/edit-restrictions`,
      )

      // Then
      const $ = cheerio.load(response.text)

      expect($('[data-qa=manage-CONTACT_GLOBAL-restriction-link-1]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/22/relationship/99/restriction/update/CONTACT_GLOBAL/enter-restriction/1',
      )

      expect($('[data-qa=manage-PRISONER_CONTACT-restriction-link-2]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/22/relationship/99/restriction/update/PRISONER_CONTACT/enter-restriction/2',
      )
    })

    it.each([
      [basicPrisonUser, 403],
      [adminUser, 403],
      [authorisingUser, 200],
    ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
      currentUser = user
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [],
        prisonerContactRestrictions: [],
      })

      await request(app)
        .get(`/prisoner/${prisonerNumber}/contacts/manage/22/relationship/99/edit-restrictions`)
        .expect(expectedStatus)
    })
  })
})
