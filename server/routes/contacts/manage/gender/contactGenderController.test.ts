import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { MockedService } from '../../../../testutils/mockedServices'
import { HmppsUser } from '../../../../interfaces/hmppsUser'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 10
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
    },
    userSupplier: () => currentUser,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/gender', () => {
  beforeEach(() => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
  })

  it.each([
    ['M', 'Male'],
    ['F', 'Female'],
    ['NK', 'Not Known / Not Recorded'],
    ['NS', ' Specified (Indeterminate)'],
  ])('should render gender page with radio selected', async (gender: string, genderDescription: string) => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ genderCode: gender, genderDescription }))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/gender`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($(`.govuk-radios__input[value='${gender}']`).attr('checked', 'checked').val()).toStrictEqual(gender)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_GENDER_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '10',
        prisonerContactId: '987654',
        prisonerNumber: 'A1234BC',
      },
    })
    expect($('title').text()).toStrictEqual('What is the contact’s gender? - Edit contact details - DPS')
    expect($('h1').first().text().trim()).toStrictEqual('What is Jones Mason’s gender?')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact details')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/10/relationship/987654',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/10/relationship/987654/edit-contact-details',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    contactsService.getContact.mockResolvedValue(TestData.contact())

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/gender`)
      .expect(expectedStatus)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/gender', () => {
  it('should update contact when gender is selected', async () => {
    contactsService.getContactName.mockResolvedValue(TestData.contact())
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/gender`)
      .type('form')
      .send({ gender: 'M' })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/10/relationship/987654')

    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      10,
      { genderCode: 'M' },
      currentUser,
      expect.any(String),
    )
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/gender`)
      .type('form')
      .send({ gender: undefined })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/gender#`,
      )
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    contactsService.getContactName.mockResolvedValue(TestData.contact())
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/gender`)
      .type('form')
      .send({ gender: 'M' })
      .expect(expectedStatus)
  })
})
