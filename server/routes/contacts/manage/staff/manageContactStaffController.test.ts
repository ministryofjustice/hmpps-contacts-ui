import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import TestData from '../../../testutils/testData'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
const prisonerNumber = 'A1234BC'

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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/staff', () => {
  test.each([
    ['YES', { isStaff: true }],
    ['NO', { isStaff: false }],
  ])('should render manage staff page when isStaff is %p', async (isStaff, expectedResponse) => {
    const getContactResponse = TestData.contact(expectedResponse)
    const contactId = getContactResponse.id
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(getContactResponse)

    // When

    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/staff`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('input[type=radio]:checked').val()).toStrictEqual(isStaff)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`,
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`,
    )

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_UPDATE_STAFF_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/staff', () => {
  const contactId = '10'
  describe('update contact with staff status', () => {
    test.each([
      ['YES', { isStaff: true, updatedBy: 'id' }],
      ['NO', { isStaff: false, updatedBy: 'id' }],
    ])('should update contact when isStaff is %p', async (isStaff, expectedPayload) => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/staff`)
        .type('form')
        .send({ isStaff })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

      expect(contactsService.updateContactById).toHaveBeenCalledWith(10, expectedPayload, user)
    })
  })
})
