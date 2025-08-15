import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { PrisonerContactRelationshipDetails } from '../../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
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
let currentUser: HmppsUser

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

  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: true })
})

afterEach(() => {
  jest.resetAllMocks()
})
describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/emergency-contact-or-next-of-kin', () => {
  test.each([
    ['EC', { isEmergencyContact: true, isNextOfKin: false }],
    ['NOK', { isEmergencyContact: false, isNextOfKin: true }],
    ['ECNOK', { isEmergencyContact: true, isNextOfKin: true }],
    ['NONE', { isEmergencyContact: false, isNextOfKin: false }],
  ])(
    'should render manage emergency contact or next of kin page when flag is %p',
    async (isEmergencyContactOrNextOfKin, relationship) => {
      const ContactDetails = TestData.contact()
      contactsService.getPrisonerContactRelationship.mockResolvedValue(
        relationship as PrisonerContactRelationshipDetails,
      )
      const contactId = ContactDetails.id
      // Given
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(ContactDetails)

      // When

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/emergency-contact-or-next-of-kin`,
      )
      const $ = cheerio.load(response.text)

      // Then
      expect(response.status).toEqual(200)
      expect($('title').text()).toStrictEqual(
        'Is this person an emergency contact or next of kin for the prisoner? - Edit contact details - DPS',
      )
      expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact relationship information')
      expect($('.main-heading').text().trim()).toBe(
        'Is Jones Mason an emergency contact or next of kin for John Smith?',
      )
      expect($('input[type=radio]:checked').val()).toStrictEqual(isEmergencyContactOrNextOfKin)
      expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/12232',
      )
      expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
      expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/12232/edit-contact-details',
      )
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
      expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')

      expect(auditService.logPageView).toHaveBeenCalledWith(
        Page.MANAGE_CONTACT_UPDATE_EMERGENCY_CONTACT_OR_NEXT_OF_KIN_PAGE,
        {
          who: currentUser.username,
          correlationId: expect.any(String),
          details: {
            contactId: '22',
            prisonerContactId: '12232',
            prisonerNumber: 'A1234BC',
          },
        },
      )
    },
  )

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    const ContactDetails = TestData.contact()
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
    const contactId = ContactDetails.id
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(ContactDetails)

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/emergency-contact-or-next-of-kin`,
      )
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/emergency-contact-or-next-of-kin', () => {
  const contactId = '10'
  describe('update contact with emergency contact and next of kin status', () => {
    test.each([
      ['EC', { isEmergencyContact: true, isNextOfKin: false }],
      ['NOK', { isEmergencyContact: false, isNextOfKin: true }],
      ['ECNOK', { isEmergencyContact: true, isNextOfKin: true }],
      ['NONE', { isEmergencyContact: false, isNextOfKin: false }],
    ])('should update contact when isApprovedToVisit is %p', async (isEmergencyContactOrNextOfKin, expectedPayload) => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContactName.mockResolvedValue(TestData.contact())
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/emergency-contact-or-next-of-kin`,
        )
        .type('form')
        .send({ isEmergencyContactOrNextOfKin })
        .expect(302)
        .expect('Location', '/prisoner/A1234BC/contacts/manage/10/relationship/12232')

      expect(contactsService.updateContactRelationshipById).toHaveBeenCalledWith(
        prisonerContactId,
        expectedPayload,
        currentUser,
        expect.any(String),
      )
    })
  })

  it('should return to enter page if there are validation errors', async () => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/emergency-contact-or-next-of-kin`,
      )
      .type('form')
      .send({ isEmergencyContactOrNextOfKin: undefined })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/emergency-contact-or-next-of-kin#`,
      )
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContactName.mockResolvedValue(TestData.contact())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/emergency-contact-or-next-of-kin`,
      )
      .type('form')
      .send({ isEmergencyContactOrNextOfKin: 'EC' })
      .expect(403)
  })
})
