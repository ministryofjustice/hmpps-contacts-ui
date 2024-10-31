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
const contactId = '10'

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
    ['true', { isStaff: true }],
    ['false', { isStaff: false }],
  ])('should render manage staff page when isStaff is %p', async (isStaff, expectedResponse) => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(TestData.contact(expectedResponse))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/staff`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('input[type=radio]:checked').val()).toStrictEqual(isStaff)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_UPDATE_STAFF_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/staff', () => {
  describe('update contact with staff status', () => {
    test.each([
      ['true', { isStaff: 'true', updatedBy: 'id' }],
      ['false', { isStaff: 'false', updatedBy: 'id' }],
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
