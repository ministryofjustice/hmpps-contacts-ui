import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import {
  appWithAllRoutes,
  flashProvider,
  basicPrisonUser,
  adminUser,
  authorisingUser,
} from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

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
    },
    userSupplier: () => currentUser,
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/delete-dob', () => {
  it('should render delete deceased date page with a deceased date', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(
      TestData.contact({
        firstName: 'First',
        middleNames: 'Middle',
        lastName: 'Last',
        dateOfBirth: '2010-12-15',
      }),
    )

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-dob`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Are you sure you want to delete the date of birth for the contact? - Edit date of birth for a contact - DPS',
    )
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete the date of birth for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/99/relationship/987654',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('dt:contains("Date of birth")').next().text()).toMatch(/15 December 2010/)
  })

  it('should have the correct navigation when query %s then go to %s', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(
      TestData.contact({
        firstName: 'First',
        middleNames: 'Middle',
        lastName: 'Last',
        dateOfBirth: '2010-12-15',
      }),
    )

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-dob`,
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
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-dob`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_DOB_DELETE_DOB_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '99',
        prisonerContactId: '987654',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    contactsService.getContact.mockResolvedValue(TestData.contact())

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-dob`)
      .expect(expectedStatus)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/delete-dob', () => {
  it('should pass to manage contacts with the date of birth removed and success message', async () => {
    contactsService.updateContactById.mockResolvedValue(TestData.contact())
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-dob`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/99/relationship/987654')

    // Then
    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      contactId,
      { dateOfBirth: null },
      currentUser,
      expect.any(String),
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the personal information for Jones Mason.',
    )
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    contactsService.updateContactById.mockResolvedValue(TestData.contact())
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/delete-dob`)
      .type('form')
      .send({})
      .expect(expectedStatus)
  })
})
