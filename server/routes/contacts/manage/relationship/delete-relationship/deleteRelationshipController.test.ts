import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { adminUserPermissions, adminUser, appWithAllRoutes, flashProvider } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { PrisonerContactSummary } from '../../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import mockPermissions from '../../../../testutils/mockPermissions'
import Permission from '../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const prisonerContactId = 12232
const contactId = 5454312
let currentUser: HmppsUser
const contactDetails = TestData.contactName({
  firstName: 'First',
  middleNames: 'Middle Names',
  lastName: 'Last',
})
const minimalContact: PrisonerContactSummary = {
  prisonerContactId,
  contactId,
  prisonerNumber,
  lastName: 'Last',
  firstName: 'First',
  relationshipTypeCode: 'S',
  relationshipTypeDescription: 'Social',
  relationshipToPrisonerCode: 'FR',
  relationshipToPrisonerDescription: 'Father',
  isApprovedVisitor: false,
  isNextOfKin: false,
  isEmergencyContact: false,
  isRelationshipActive: false,
  currentTerm: true,
  isStaff: false,
  restrictionSummary: {
    active: [],
    totalActive: 0,
    totalExpired: 0,
  },
}

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => currentUser,
  })
  mockPermissions(app, adminUserPermissions)

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(
    TestData.prisoner({
      firstName: 'Person',
      middleNames: 'In A',
      lastName: 'Prison',
    }),
  )
  contactsService.getContactName.mockResolvedValue(contactDetails)
  contactsService.getAllSummariesForPrisonerAndContact.mockResolvedValue([
    {
      ...minimalContact,
      prisonerContactId: 15896471,
      relationshipToPrisonerCode: 'BRO',
      relationshipToPrisonerDescription: 'Brother',
      isRelationshipActive: true,
    },
    {
      ...minimalContact,
      prisonerContactId,
      relationshipToPrisonerCode: 'FRI',
      relationshipToPrisonerDescription: 'Friend',
      isRelationshipActive: true,
    },
  ])
})

afterEach(() => {
  jest.resetAllMocks()
})
describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/delete', () => {
  const backLinkCases = [
    ['contact-details', '/prisoner/A1234BC/contacts/manage/5454312/relationship/12232'],
    ['edit-contact-details', '/prisoner/A1234BC/contacts/manage/5454312/relationship/12232/edit-contact-details'],
    ['gibberish', '/prisoner/A1234BC/contacts/manage/5454312/relationship/12232/edit-contact-details'],
  ]

  it.each(backLinkCases)(
    'should render delete page when there are some relationship restrictions with correct back link for %s',
    async (backTo, expectedBackLink) => {
      // Given
      contactsService.planDeleteContactRelationship.mockResolvedValue({
        willAlsoDeleteContactDob: false,
        hasRestrictions: false,
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete?backTo=${backTo}`,
      )
      const $ = cheerio.load(response.text)

      // Then
      expect(response.status).toEqual(200)
      expect($('title').text()).toStrictEqual(
        'Are you sure you want to delete a relationship? - Edit contact details - DPS',
      )
      expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contacts')
      expect($('[data-qa=main-heading]').first().text().trim()).toBe(
        'Are you sure you want to delete this relationship between First Middle Names Last and the prisoner Person Prison?',
      )
      expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
      expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(expectedBackLink)
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
      expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Yes, delete')
      const cancelButton = $('[data-qa=cancel-button]').first()
      expect(cancelButton.attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/manage/5454312/relationship/12232')
      expect(cancelButton.text().trim()).toStrictEqual('No, do not delete')

      expect($('[data-qa=relationship-delete-warning]')).toHaveLength(1)

      // check it chose the correct relationship from all summaries
      const rows = $('#prisoner-contact-list tbody tr')
      const firstRowColumns = rows.eq(0).find('td')
      const lines = firstRowColumns.eq(2).text().trim().split(/\r?\n/)
      expect(lines).toHaveLength(1)
      expect(lines[0]!.trim()).toStrictEqual('Friend')

      const contactLinks = $('[data-qa=contact-5454312-link]')
      expect(contactLinks).toHaveLength(1)
      expect(contactLinks.first().attr('href')).toStrictEqual(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
      )
    },
  )

  it.each(backLinkCases)(
    'should render delete page when there are no relationship restrictions with correct back link for %s',
    async (backTo, expectedBackLink) => {
      // Given
      contactsService.planDeleteContactRelationship.mockResolvedValue({
        willAlsoDeleteContactDob: false,
        hasRestrictions: true,
      })

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete?backTo=${backTo}`,
      )
      const $ = cheerio.load(response.text)

      // Then
      expect(response.status).toEqual(200)
      expect($('title').text()).toStrictEqual(
        'You cannot delete the record of the relationship as it includes information about relationship restrictions - Edit contact details - DPS',
      )
      expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contacts')
      expect($('[data-qa=main-heading]').first().text().trim()).toBe(
        'You cannot delete the record of this relationship as it includes information about relationship restrictions',
      )
      expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
      expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(expectedBackLink)
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
      expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Continue')
      expect($('[data-qa=cancel-button]')).toHaveLength(0)
      expect($('[data-qa=relationship-delete-warning]')).toHaveLength(0)
    },
  )

  it('should audit the page view', async () => {
    // Given
    contactsService.planDeleteContactRelationship.mockResolvedValue({
      willAlsoDeleteContactDob: false,
      hasRestrictions: false,
    })

    // When
    await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_DELETE_RELATIONSHIP, {
      who: adminUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '5454312',
        prisonerContactId: '12232',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.planDeleteContactRelationship.mockResolvedValue({
      willAlsoDeleteContactDob: false,
      hasRestrictions: false,
    })

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete`)
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/delete', () => {
  it('should proceed with delete if yes selected', async () => {
    contactsService.deleteContactRelationship.mockResolvedValue()
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete`)
      .type('form')
      .send({ deleteRelationshipAction: 'DELETE' })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/list')

    expect(contactsService.deleteContactRelationship).toHaveBeenCalledWith(
      prisonerNumber,
      contactId,
      prisonerContactId,
      adminUser,
      expect.any(String),
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve deleted a relationship from Person Prison’s contact list.',
    )
  })

  it('should proceed go to contact list if that option is selected', async () => {
    contactsService.deleteContactRelationship.mockResolvedValue()
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete`)
      .type('form')
      .send({ deleteRelationshipAction: 'GO_TO_CONTACT_LIST' })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/list')

    expect(contactsService.deleteContactRelationship).not.toHaveBeenCalled()
    expect(flashProvider).not.toHaveBeenCalledWith(FLASH_KEY__SUCCESS_BANNER, expect.anything)
  })

  it('should proceed go to contact record if that option is selected', async () => {
    contactsService.deleteContactRelationship.mockResolvedValue()
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete`)
      .type('form')
      .send({ deleteRelationshipAction: 'GO_TO_CONTACT_RECORD' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    expect(contactsService.deleteContactRelationship).not.toHaveBeenCalled()
    expect(flashProvider).not.toHaveBeenCalledWith(FLASH_KEY__SUCCESS_BANNER, expect.anything)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete`)
      .type('form')
      .send({})
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete#`,
      )
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete`)
      .type('form')
      .send({ deleteRelationshipAction: 'GO_TO_CONTACT_LIST' })
      .expect(403)
  })
})
