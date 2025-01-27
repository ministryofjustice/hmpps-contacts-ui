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
describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/approved-to-visit', () => {
  test.each([
    ['YES', { isApprovedVisitor: true }],
    ['NO', { isApprovedVisitor: false }],
  ])('should render manage approved to visit page when flag is %p', async (isApprovedToVisit, expectedResponse) => {
    const ContactDetails = TestData.contact()
    contactsService.getPrisonerContactRelationship.mockResolvedValue(expectedResponse)
    const contactId = ContactDetails.id
    // Given
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(ContactDetails)

    // When

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/approved-to-visit?returnUrl=/foo-bar`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('input[type=radio]:checked').val()).toStrictEqual(isApprovedToVisit)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_UPDATE_APPROVED_TO_VISIT_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/approved-to-visit', () => {
  const contactId = '10'
  describe('update contact with approved to visit status', () => {
    test.each([
      ['YES', { isApprovedVisitor: true, updatedBy: 'user1' }],
      ['NO', { isApprovedVisitor: false, updatedBy: 'user1' }],
    ])('should update contact when isApprovedToVisit is %p', async (isApprovedToVisit, expectedPayload) => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/approved-to-visit?returnUrl=/foo-bar`,
        )
        .type('form')
        .send({ isApprovedToVisit })
        .expect(302)
        .expect('Location', '/foo-bar')

      expect(contactsService.updateContactRelationshipById).toHaveBeenCalledWith(
        prisonerContactId,
        expectedPayload,
        user,
      )
    })
  })
})
