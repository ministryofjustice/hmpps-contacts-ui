import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const prisonerContactId = 12232

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
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
      contactsService.getPrisonerContactRelationship.mockResolvedValue(relationship)
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
          who: user.username,
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
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/emergency-contact-or-next-of-kin', () => {
  const contactId = '10'
  describe('update contact with emergency contact and next of kin status', () => {
    test.each([
      ['EC', { isEmergencyContact: true, isNextOfKin: false, updatedBy: 'user1' }],
      ['NOK', { isEmergencyContact: false, isNextOfKin: true, updatedBy: 'user1' }],
      ['ECNOK', { isEmergencyContact: true, isNextOfKin: true, updatedBy: 'user1' }],
      ['NONE', { isEmergencyContact: false, isNextOfKin: false, updatedBy: 'user1' }],
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
        user,
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
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/emergency-contact-or-next-of-kin`,
      )
  })
})
