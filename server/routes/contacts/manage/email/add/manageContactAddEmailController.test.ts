import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import {
  appWithAllRoutes,
  flashProvider,
  basicPrisonUser,
  adminUser,
  adminUserPermissions,
} from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { ContactDetails, CreateMultipleEmailsRequest } from '../../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
import mockPermissions from '../../../../testutils/mockPermissions'
import Permission from '../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')
jest.mock('../../../../../services/alertsService')

const alertsService = MockedService.AlertsService()
const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
let currentUser: HmppsUser
const prisonerNumber = 'A1234BC'
const contactId = 987654
const prisonerContactId = 456789
const contact: ContactDetails = {
  id: contactId,
  isStaff: false,
  interpreterRequired: false,
  addresses: [],
  phoneNumbers: [],
  emailAddresses: [],
  employments: [],
  identities: [],
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: basicPrisonUser.username,
  createdTime: '2024-01-01',
}

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      contactsService,
      alertsService,
    },
    userSupplier: () => currentUser,
  })

  mockPermissions(app, adminUserPermissions)

  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/email/create', () => {
  it('should render create email page with navigation back to manage contact', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Add email addresses for the contact - Edit contact methods - DPS')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Add email addresses for First Middle Last')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789/edit-contact-methods',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '987654',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { emails: [{ emailAddress: 'name@' }] }
    contactsService.getContact.mockResolvedValue(contact)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=emails-0-email-address]').first().val()).toStrictEqual('name@')
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`)
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/email/create', () => {
  it('should create email and pass to manage contact details page if there are no validation errors', async () => {
    contactsService.getContactName.mockResolvedValue(contact)
    contactsService.createContactEmails.mockResolvedValue([])
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`)
      .type('form')
      .send('save=')
      .send('emails[0][emailAddress]=test@example.com')
      .expect(302)
      .expect('Location', `/prisoner/A1234BC/contacts/manage/987654/relationship/456789`)

    const requestBody: CreateMultipleEmailsRequest = {
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    }

    expect(contactsService.createContactEmails).toHaveBeenCalledWith(
      contactId,
      requestBody,
      currentUser,
      expect.any(String),
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the contact methods for First Middle Last.',
    )
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`)
      .type('form')
      .send('save=')
      .send('emails[0][emailAddress]=')
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create#`,
      )
    expect(contactsService.createContactEmails).not.toHaveBeenCalled()
  })

  describe('should work without javascript enabled', () => {
    it('should return to input page without validating if we are adding an email', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`)
        .type('form')
        .send('add=')
        .send('emails[0][emailAddress]=invalidemail')
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`,
        )
      expect(contactsService.createContactIdentities).not.toHaveBeenCalled()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          emails: [{ emailAddress: 'invalidemail' }, { emailAddress: '' }],
          add: '',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating if we are removing an email', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`)
        .type('form')
        .send('remove=1')
        .send('emails[0][emailAddress]=invalidemail')
        .send('emails[1][emailAddress]=removeme@example.com')
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`,
        )
      expect(contactsService.createContactIdentities).not.toHaveBeenCalled()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          emails: [{ emailAddress: 'invalidemail' }],
          remove: '1',
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })

    it('should return to input page without validating even if action is not save, add or remove', async () => {
      await request(app)
        .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`)
        .type('form')
        .send('emails[0][emailAddress]=invalidemail')
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`,
        )
      expect(contactsService.createContactIdentities).not.toHaveBeenCalled()
      expect(flashProvider).toHaveBeenCalledWith(
        'formResponses',
        JSON.stringify({
          emails: [{ emailAddress: 'invalidemail' }],
        }),
      )
      expect(flashProvider).not.toHaveBeenCalledWith('validationErrors', expect.anything())
    })
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContactName.mockResolvedValue(contact)
    contactsService.createContactEmails.mockResolvedValue([])
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/create`)
      .type('form')
      .send('save=')
      .send('emails[0][emailAddress]=test@example.com')
      .expect(403)
  })
})
