import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, adminUser, adminUserPermissions } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import { mockedReferenceData, STUBBED_TITLE_OPTIONS } from '../../../testutils/stubReferenceData'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { PatchContactRequest, PatchContactResponse } from '../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const contactId = 99
const prisonerContactId = 42
const prisonerNumber = 'A1234BC'
const contact = TestData.contact({
  id: contactId,
  firstName: 'first',
  middleNames: 'middle names',
  lastName: 'last',
})
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      contactsService,
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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/change-contact-title-or-middle-names', () => {
  it('should render update name page with correct navigation and labeling', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Change the title or middle name for the contact - Edit contact details - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact details')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Change the title or middle name for First Middle Names Last',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/99/relationship/42',
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/99/relationship/42/edit-contact-details',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('title options are ordered alphabetically', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('#title :nth-child(1)').text()).toStrictEqual('Select title')
    expect($('#title :nth-child(2)').text()).toStrictEqual('')
    expect($('#title :nth-child(3)').text()).toStrictEqual('Brother')
    expect($(`#title :nth-child(${STUBBED_TITLE_OPTIONS.length + 2})`).text()).toStrictEqual('Sister')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_NAME_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '99',
        prisonerContactId: '42',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { middleNames: 'middle updated', title: 'DR' }
    contactsService.getContactName.mockResolvedValue(
      TestData.contact({
        id: contact.id,
        firstName: 'first',
        lastName: 'last',
        middleNames: 'middle',
        titleCode: 'MR',
      }),
    )
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#middleNames').val()).toStrictEqual('middle updated')
    expect($('#title').val()).toStrictEqual('DR')
  })

  it('should render contact names with first and last capitalised', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(
      TestData.contact({
        id: contact.id,
        firstName: 'first',
        lastName: 'last',
        middleNames: 'middle',
        titleCode: 'MR',
      }),
    )

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').text()).toStrictEqual('First')
    expect($('#middleNames').val()).toStrictEqual('middle')
    expect($('#lastName').text()).toStrictEqual('Last')
    expect($('#title').val()).toStrictEqual('MR')
  })

  it('should render contact names if optional values missing', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue({
      firstName: 'first',
      lastName: 'last',
    })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').text()).toStrictEqual('First')
    expect($('#middleNames').val()).toBeUndefined()
    expect($('#lastName').text()).toStrictEqual('Last')
    expect($('#title').val()).toStrictEqual('')
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContactName.mockResolvedValue({
      firstName: 'first',
      lastName: 'last',
    })

    // When
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
      )
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/change-contact-title-or-middle-names', () => {
  it('should pass to success page if there are no validation errors with success message including updated name', async () => {
    const patchResponse: Partial<PatchContactResponse> = {
      firstName: 'first',
      lastName: 'last',
      middleNames: 'mid',
      titleCode: 'DR',
    }
    contactsService.updateContactById.mockResolvedValue(patchResponse as PatchContactResponse)

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
      )
      .type('form')
      .send({ middleNames: 'mid', title: 'DR' })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/99/relationship/42')

    const expectedRequest: PatchContactRequest = {
      titleCode: 'DR',
      middleNames: 'mid',
    }

    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      contactId,
      expectedRequest,
      currentUser,
      expect.any(String),
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the personal information for First Mid Last.',
    )
  })

  it('should return to enter page with details kept if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
      )
      .type('form')
      .send({ middleNames: ''.padEnd(36, 'X') })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names#`,
      )
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    const patchResponse: Partial<PatchContactResponse> = {
      firstName: 'first',
      lastName: 'last',
      middleNames: 'mid',
      titleCode: 'DR',
    }
    contactsService.updateContactById.mockResolvedValue(patchResponse as PatchContactResponse)

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/change-contact-title-or-middle-names`,
      )
      .type('form')
      .send({ middleNames: 'mid', title: 'DR' })
      .expect(403)
  })
})
