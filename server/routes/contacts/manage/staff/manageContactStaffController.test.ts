import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const prisonerContactId = 987654

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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/staff', () => {
  test.each([
    ['YES', { isStaff: true }],
    ['NO', { isStaff: false }],
  ])('should render manage staff page when isStaff is %p', async (isStaff, expectedResponse) => {
    const ContactDetails = TestData.contact(expectedResponse)
    const contactId = ContactDetails.id
    // Given
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(ContactDetails)

    // When

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/staff`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('input[type=radio]:checked').val()).toStrictEqual(isStaff)
    expect($('[data-qa=continue-button]').text().trim()).toStrictEqual('Confirm and save')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/22/relationship/987654',
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/22/relationship/987654/edit-contact-details',
    )

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_UPDATE_STAFF_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/staff', () => {
  const contactId = '10'
  describe('update contact with staff status', () => {
    test.each([
      ['YES', { isStaff: true, updatedBy: 'user1' }],
      ['NO', { isStaff: false, updatedBy: 'user1' }],
    ])('should update contact when isStaff is %p', async (isStaff, expectedPayload) => {
      contactsService.getContactName.mockResolvedValue(TestData.contact())
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/staff`)
        .type('form')
        .send({ isStaff })
        .expect(302)
        .expect('Location', '/prisoner/A1234BC/contacts/manage/10/relationship/987654')

      expect(contactsService.updateContactById).toHaveBeenCalledWith(10, expectedPayload, user)
    })
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/staff`)
      .type('form')
      .send({ isStaff: undefined })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/staff`,
      )
  })
})
