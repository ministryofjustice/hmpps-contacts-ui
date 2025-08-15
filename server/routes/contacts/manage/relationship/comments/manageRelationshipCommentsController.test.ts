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
const prisonerContactId = '1'
const contactId = '10'
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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-comments', () => {
  it('should render manage additional information for a contacts page', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue({
      comments: 'true',
    } as PrisonerContactRelationshipDetails)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-comments`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Change the comments on the relationship between the contact and the prisoner - Edit contact details - DPS',
    )
    expect($('[data-qa=main-heading]').text().trim()).toBe(
      'Change the comments on the relationship between Jones Mason and John Smith',
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
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_EDIT_RELATIONSHIP_COMMENTS_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '10',
        prisonerContactId: '1',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue({
      comments: 'true',
    } as PrisonerContactRelationshipDetails)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-comments`,
      )
      .expect(403)
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/relationship-comments`, () => {
  it('should update additional information for a contacts', async () => {
    contactsService.getContactName.mockResolvedValue(TestData.contact())
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-comments`,
      )
      .type('form')
      .send({ comments: 'comment added' })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/10/relationship/1')
    expect(contactsService.updateContactRelationshipById).toHaveBeenCalledWith(
      1,
      { comments: 'comment added' },
      currentUser,
      expect.any(String),
    )
  })

  it('should return to enter page if there are validation errors', async () => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-comments`,
      )
      .type('form')
      .send({ comments: 'a'.repeat(241) })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-comments#`,
      )
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContactName.mockResolvedValue(TestData.contact())
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/relationship-comments`,
      )
      .type('form')
      .send({ comments: 'comment added' })
      .expect(403)
  })
})
