import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, basicPrisonUser } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { PrisonerContactRelationshipDetails } from '../../../../../@types/contactsApiClient'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const prisonerContactId = '1'
const contactId = '10'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => basicPrisonUser,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-status', () => {
  it('should render manage relationship status active status page', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue({
      isRelationshipActive: true,
    } as PrisonerContactRelationshipDetails)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-status`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'What is the status of the relationship between the contact and the prisoner? - Edit contact details - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact relationship information')
    expect($('.main-heading').text().trim()).toBe(
      'What is the status of the relationship between Jones Mason and John Smith?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/10/relationship/1',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/10/relationship/1/edit-contact-details',
    )
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_EDIT_RELATIONSHIP_STATUS_PAGE, {
      who: basicPrisonUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '10',
        prisonerContactId: '1',
        prisonerNumber: 'A1234BC',
      },
    })
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-status`, () => {
  it.each([
    [true, 'YES'],
    [false, 'NO'],
  ])(
    'should update relationship status active status to %s when %s is selected',
    async (expected: boolean, input: string) => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContactName.mockResolvedValue(TestData.contact())
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-status`,
        )
        .type('form')
        .send({ relationshipStatus: input })
        .expect(302)
        .expect('Location', '/prisoner/A1234BC/contacts/manage/10/relationship/1')
      expect(contactsService.updateContactRelationshipById).toHaveBeenCalledWith(
        1,
        { isRelationshipActive: expected },
        basicPrisonUser,
        expect.any(String),
      )
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-status`,
      )
      .type('form')
      .send({ relationshipStatus: undefined })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-status#`,
      )
  })
})
