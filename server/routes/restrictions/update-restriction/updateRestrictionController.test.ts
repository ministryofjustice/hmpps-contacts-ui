import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser, flashProvider } from '../../testutils/appSetup'
import { Page } from '../../../services/auditService'
import { mockedReferenceData } from '../../testutils/stubReferenceData'
import TestData from '../../testutils/testData'
import { RestrictionSchemaType } from '../schema/restrictionSchema'
import { MockedService } from '../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../middleware/setUpSuccessNotificationBanner'
import {
  ContactDetails,
  ContactRestrictionDetails,
  PrisonerContactRestrictionDetails,
  PrisonerContactRestrictionsResponse,
} from '../../../@types/contactsApiClient'
import { HmppsUser } from '../../../interfaces/hmppsUser'

jest.mock('../../../services/auditService')
jest.mock('../../../services/referenceDataService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/restrictionsService')
jest.mock('../../../services/contactsService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const restrictionsService = MockedService.RestrictionsService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 123
const prisonerContactId = 321
const restrictionId = 999
const contact: ContactDetails = {
  id: contactId,
  titleCode: 'MR',
  titleDescription: 'MR',
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

let currentUser = authorisingUser

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      restrictionsService,
      contactsService,
    },
    userSupplier: () => currentUser,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  contactsService.getContact.mockResolvedValue(contact)
  contactsService.getContactName.mockResolvedValue(contact)
  contactsService.getGlobalContactRestrictions.mockResolvedValue([
    TestData.getContactRestrictionDetails({
      contactRestrictionId: 1,
      restrictionType: 'CCTV',
    }),
    TestData.getContactRestrictionDetails({
      contactRestrictionId: restrictionId,
      restrictionType: 'BAN',
      startDate: '2024-02-01',
      expiryDate: '2025-03-02',
      comments: 'some comments',
    }),
  ])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/update/:restrictionClass/enter-restriction/:restrictionId', () => {
  it('should render enter restriction page for PRISONER_CONTACT', async () => {
    // Given
    contactsService.getPrisonerContactRestrictions.mockResolvedValue({
      prisonerContactRestrictions: [
        TestData.getPrisonerContactRestrictionDetails({
          prisonerContactRestrictionId: 1,
          restrictionType: 'CCTV',
        }),
        TestData.getPrisonerContactRestrictionDetails({
          prisonerContactRestrictionId: restrictionId,
          restrictionType: 'BAN',
          startDate: '2024-02-01',
          expiryDate: '2025-03-02',
          comments: 'some comments',
        }),
      ],
    } as unknown as PrisonerContactRestrictionsResponse)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/PRISONER_CONTACT/enter-restriction/${restrictionId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Update a relationship restriction - Manage contact restrictions - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contact restrictions')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Update a relationship restriction')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-restrictions`,
    )
    expect($('[data-qa=prisoner-name-and-id]').first().text().trim()).toStrictEqual('John Smith (A1234BC)')
    expect($('[data-qa=contact-name-and-id]').first().text().trim()).toStrictEqual('First Middle Last (123)')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)

    expect($('#type').val()).toStrictEqual('BAN')
    expect($('#startDate').val()).toStrictEqual('01/02/2024')
    expect($('#expiryDate').val()).toStrictEqual('02/03/2025')
    expect($('#comments').val()).toStrictEqual('some comments')
  })

  it('should render enter restriction page for CONTACT_GLOBAL', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Update a global restriction for the contact - Manage contact restrictions - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contact restrictions')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Update a global restriction for contact First Middle Last',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-restrictions`,
    )
    expect($('[data-qa=prisoner-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=contact-name-and-id]')).toHaveLength(0)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)

    expect($('#type').val()).toStrictEqual('BAN')
    expect($('#startDate').val()).toStrictEqual('01/02/2024')
    expect($('#expiryDate').val()).toStrictEqual('02/03/2025')
    expect($('#comments').val()).toStrictEqual('some comments')
  })

  it('should call the audit service for the page view', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_RESTRICTION_PAGE, {
      who: authorisingUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '123',
        prisonerContactId: '321',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { type: 'CHILD', startDate: '9/9/1999', expiryDate: 'never', comments: 'changed comments' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#type').val()).toStrictEqual('CHILD')
    expect($('#startDate').val()).toStrictEqual('9/9/1999')
    expect($('#expiryDate').val()).toStrictEqual('never')
    expect($('#comments').val()).toStrictEqual('changed comments')
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 403],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}`,
      )
      .expect(expectedStatus)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/update/:restrictionClass/enter-restriction/:restrictionId', () => {
  it('should update restriction and pass to entry point with flash success for PRISONER_CONTACT if there are no validation errors', async () => {
    restrictionsService.updatePrisonerContactRestriction.mockResolvedValue({} as PrisonerContactRestrictionDetails)
    contactsService.getContactName.mockResolvedValue(contact)
    const form: RestrictionSchemaType = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'some comments',
    }
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/PRISONER_CONTACT/enter-restriction/${restrictionId}`,
      )
      .type('form')
      .send(form)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)
    expect(restrictionsService.updatePrisonerContactRestriction).toHaveBeenCalledWith(
      prisonerContactId,
      restrictionId,
      form,
      authorisingUser,
      expect.any(String),
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the relationship restrictions between contact First Middle Last and prisoner John Smith.',
    )
  })

  it('should update restriction and pass to entry point with flash success for CONTACT_GLOBAL if there are no validation errors', async () => {
    restrictionsService.updateContactGlobalRestriction.mockResolvedValue({} as ContactRestrictionDetails)
    contactsService.getContactName.mockResolvedValue(contact)
    const form: RestrictionSchemaType = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'some comments',
    }
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}`,
      )
      .type('form')
      .send(form)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)
    expect(restrictionsService.updateContactGlobalRestriction).toHaveBeenCalledWith(
      contactId,
      restrictionId,
      form,
      authorisingUser,
      expect.any(String),
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the global restrictions for First Middle Last.',
    )
  })

  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should return to enter page with details kept if there are validation errors (%s)',
    async restrictionClass => {
      await request(app)
        .post(
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/${restrictionClass}/enter-restriction/${restrictionId}`,
        )
        .type('form')
        .send({})
        .expect(302)
        .expect(
          'Location',
          `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/${restrictionClass}/enter-restriction/${restrictionId}#`,
        )
    },
  )

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 403],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    restrictionsService.updateContactGlobalRestriction.mockResolvedValue({} as ContactRestrictionDetails)
    contactsService.getContactName.mockResolvedValue(contact)
    const form: RestrictionSchemaType = {
      type: 'BAN',
      startDate: '1/2/2024',
      expiryDate: '2/3/2025',
      comments: 'some comments',
    }
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/CONTACT_GLOBAL/enter-restriction/${restrictionId}`,
      )
      .type('form')
      .send(form)
      .expect(expectedStatus)
  })
})
