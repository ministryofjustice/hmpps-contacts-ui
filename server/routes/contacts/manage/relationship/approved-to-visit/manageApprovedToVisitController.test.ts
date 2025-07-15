import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { PrisonerContactRelationshipDetails } from '../../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'

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
  currentUser = authorisingUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => currentUser,
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
    const contactDetails = TestData.contact()
    contactsService.getPrisonerContactRelationship.mockResolvedValue(
      expectedResponse as PrisonerContactRelationshipDetails,
    )
    const contactId = contactDetails.id
    // Given
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(contactDetails)

    // When

    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/approved-to-visit`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('title').text()).toStrictEqual(
      'Is the contact approved to visit the prisoner? - Edit contact details - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact relationship information')
    expect($('.main-heading').text().trim()).toBe('Is Jones Mason approved to visit John Smith?')
    expect($('input[type=radio]:checked').val()).toStrictEqual(isApprovedToVisit)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/22/relationship/12232',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/22/relationship/12232/edit-contact-details',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')
    // Assert hint text and details are NOT present
    expect($('.govuk-hint').length).toBe(0)

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_UPDATE_APPROVED_TO_VISIT_PAGE, {
      who: authorisingUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '22',
        prisonerContactId: '12232',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 403],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    const contactDetails = TestData.contact()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(contactDetails)
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactDetails.id}/relationship/${prisonerContactId}/approved-to-visit`,
      )
      .expect(expectedStatus)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/approved-to-visit', () => {
  const contactId = '10'
  describe('update contact with approved to visit status', () => {
    test.each([
      ['YES', { isApprovedVisitor: true }],
      ['NO', { isApprovedVisitor: false }],
    ])('should update contact when isApprovedToVisit is %p', async (isApprovedToVisit, expectedPayload) => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContactName.mockResolvedValue(TestData.contact())
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/approved-to-visit`,
        )
        .type('form')
        .send({ isApprovedToVisit })
        .expect(302)
        .expect('Location', '/prisoner/A1234BC/contacts/manage/10/relationship/12232')

      expect(contactsService.updateContactRelationshipById).toHaveBeenCalledWith(
        prisonerContactId,
        expectedPayload,
        authorisingUser,
        expect.any(String),
      )
    })
  })

  it('should return to enter page if there are validation errors', async () => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/approved-to-visit`,
      )
      .type('form')
      .send({ isApprovedToVisit: undefined })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/approved-to-visit#`,
      )
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 403],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContactName.mockResolvedValue(TestData.contact())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/approved-to-visit`,
      )
      .type('form')
      .send({ isApprovedToVisit: 'YES' })
      .expect(expectedStatus)
  })
})
