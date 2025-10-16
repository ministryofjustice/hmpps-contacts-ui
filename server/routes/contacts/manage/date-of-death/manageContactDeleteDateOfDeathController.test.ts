import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, adminUser, adminUserPermissions } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/alertsService')

const alertsService = MockedService.AlertsService()
const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const contactId = 99
const prisonerContactId = 987654
const prisonerNumber = 'A1234BC'
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      alertsService,
    },
    userSupplier: () => currentUser,
  })

  mockPermissions(app, adminUserPermissions)

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/delete-date-of-death', () => {
  it('should render delete deceased date page with a deceased date', async () => {
    // Given
    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerSearchService,
        contactsService,
        alertsService,
      },
      userSupplier: () => currentUser,
    })
    contactsService.getContact.mockResolvedValue(
      TestData.contact({
        firstName: 'First',
        middleNames: 'Middle',
        lastName: 'Last',
        deceasedDate: '2010-12-15',
      }),
    )

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-date-of-death`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Are you sure you want to delete the date of death for the contact? - Edit contact details - DPS',
    )
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete the date of death for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/99/relationship/987654',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('dt:contains("Date of death")').next().text()).toMatch(/15 December 2010/)
  })

  it('should have the correct navigation when query %s then go to %s', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(
      TestData.contact({
        firstName: 'First',
        middleNames: 'Middle',
        lastName: 'Last',
        deceasedDate: '2010-12-15',
      }),
    )

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-date-of-death`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/99/relationship/987654',
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/99/relationship/987654/edit-contact-details',
    )
  })

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({}))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-date-of-death`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_CONFIRM_DELETE_DATE_OF_DEATH_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '99',
        prisonerContactId: '987654',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContact.mockResolvedValue(TestData.contact())

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-date-of-death`,
      )
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/delete-date-of-death', () => {
  it('should pass to manage contacts with the deceased date removed and success message', async () => {
    contactsService.updateContactById.mockResolvedValue(TestData.contact())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-date-of-death`,
      )
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/99/relationship/987654')

    // Then
    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      contactId,
      { deceasedDate: null },
      currentUser,
      expect.any(String),
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the personal information for Jones Mason.',
    )
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.updateContactById.mockResolvedValue(TestData.contact())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-date-of-death`,
      )
      .type('form')
      .send({})
      .expect(403)
  })
})
