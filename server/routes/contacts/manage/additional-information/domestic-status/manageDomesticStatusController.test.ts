import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { adminUserPermissions, adminUser, appWithAllRoutes } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedReferenceData, STUBBED_DOMESTIC_STATUS_OPTIONS } from '../../../../testutils/stubReferenceData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
import mockPermissions from '../../../../testutils/mockPermissions'
import Permission from '../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/alertsService')

const alertsService = MockedService.AlertsService()
const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = '10'
const prisonerContactId = 987654
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
      alertsService,
    },
    userSupplier: () => currentUser,
  })

  mockPermissions(app, adminUserPermissions)

  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/domestic-status', () => {
  beforeEach(() => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
  })

  it.each(STUBBED_DOMESTIC_STATUS_OPTIONS.map(itm => [itm.code, itm.description]))(
    'should render manage domestic status page with status selected',
    async (code: string, description: string) => {
      // Given
      contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: code }))

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/domestic-status`,
      )
      const $ = cheerio.load(response.text)

      // Then
      expect(response.status).toEqual(200)
      expect($('title').text()).toStrictEqual('What is the contact’s domestic status? - Edit contact details - DPS')
      expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit additional information for a contact')
      expect($('.main-heading').text().trim()).toBe('What is Jones Mason’s domestic status?')
      const checkedOption = $('.govuk-radios__input:checked')
      expect(checkedOption.val()).toStrictEqual(code)
      expect(checkedOption.next().text().trim()).toEqual(description)
      expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/10/relationship/987654',
      )
      expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
      expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/10/relationship/987654/edit-contact-details',
      )
      expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
      expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_DOMESTIC_STATUS_PAGE, {
        who: currentUser.username,
        correlationId: expect.any(String),
        details: {
          contactId: '10',
          prisonerContactId: '987654',
          prisonerNumber: 'A1234BC',
        },
      })
    },
  )

  it('should render manage domestic status page with no status selected', async () => {
    // Given
    const contact = TestData.contact()
    delete contact.domesticStatusCode
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/domestic-status`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit additional information for a contact')
    expect($('.main-heading').text().trim()).toBe('What is Jones Mason’s domestic status?')
    expect($('.govuk-radios__input:checked').val()).toBeFalsy()
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContact.mockResolvedValue(TestData.contact())

    // When
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/domestic-status`)
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/domestic-status', () => {
  it('should update contact when domestic status is selected', async () => {
    contactsService.getContactName.mockResolvedValue(TestData.contact({}))
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/domestic-status`,
      )
      .type('form')
      .send({ domesticStatusCode: 'S' })
      .expect(302)
      .expect('Location', `/prisoner/A1234BC/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      10,
      { domesticStatusCode: 'S' },
      currentUser,
      expect.any(String),
    )
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/domestic-status`,
      )
      .type('form')
      .send({ domesticStatusCode: undefined })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/domestic-status#`,
      )

    expect(contactsService.updateContactById).not.toHaveBeenCalled()
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContactName.mockResolvedValue(TestData.contact({}))
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/domestic-status`,
      )
      .type('form')
      .send({ domesticStatusCode: 'S' })
      .expect(403)
  })
})
