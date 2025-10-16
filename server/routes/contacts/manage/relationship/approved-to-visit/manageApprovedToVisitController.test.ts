import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, authorisingUser, authorisingUserPermissions } from '../../../../testutils/appSetup'
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
jest.mock('../../../../../services/alertsService')

const alertsService = MockedService.AlertsService()
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
      alertsService,
    },
    userSupplier: () => currentUser,
  })
  mockPermissions(app, authorisingUserPermissions)
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

    // Assert hint text and details are present
    const hintHtml = $('.govuk-hint').html()
    expect(hintHtml).not.toContain('Skip this question if:')
    expect(hintHtml).not.toContain('the contact has not yet been checked and approved for visits to this prisoner')
    expect(hintHtml).not.toContain(
      'for any other reason, you’re not sure whether the contact is approved to visit the prisoner or not',
    )
    // Check details summary
    expect(hintHtml).toContain('Procedures for approving visitors')
    expect(hintHtml).toContain('Check your local procedures when approving visitors for prisoners.')
    expect(hintHtml).toContain('person posing a risk to children (PPRC)')
    expect(hintHtml).toContain('harassment offence (including stalking)')
    expect(hintHtml).toContain('public protection contact restrictions')
    expect(hintHtml).toContain('domestic abuse perpetrator')
    expect(hintHtml).toContain('Sex Offences Act 2003')

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

  it('GET should block access without edit contact visit approval permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_visit_approval]: false })
    const contactDetails = TestData.contact()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(contactDetails)
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactDetails.id}/relationship/${prisonerContactId}/approved-to-visit`,
      )
      .expect(403)
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

  it('POST should block access without edit contact visit approval permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_visit_approval]: false })

    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContactName.mockResolvedValue(TestData.contact())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/approved-to-visit`,
      )
      .type('form')
      .send({ isApprovedToVisit: 'YES' })
      .expect(403)
  })
})
