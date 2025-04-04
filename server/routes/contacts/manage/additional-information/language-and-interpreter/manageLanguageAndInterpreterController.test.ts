import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { MockedService } from '../../../../../testutils/mockedServices'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')
jest.mock('../../../../../services/referenceDataService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = '10'
const prisonerContactId = 987654

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/language-and-interpreter', () => {
  it('should render manage language and interpretation requirement page', async () => {
    // Given
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact({ interpreterRequired: true }))
    referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/language-and-interpreter`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('title').text()).toStrictEqual(
      'Enter language and interpretation requirements - Edit contact details - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit additional information for a contact')
    expect($('.govuk-heading-l').text().trim()).toBe('Enter language and interpretation requirements')
    expect($('.govuk-fieldset__legend--m:contains("What is Jones Mason’s first language?")').text()).toBeTruthy()
    expect($('.govuk-fieldset__legend--m:contains("Does Jones Mason require an interpreter?")').text()).toBeTruthy()
    const checkedOption = $('.govuk-radios__input:checked')
    expect(checkedOption.val()).toStrictEqual('YES')
    expect(checkedOption.next().text().trim()).toEqual('Yes')

    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/10/relationship/987654',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/10/relationship/987654/edit-contact-details',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_LANGUAGE_AND_INTERPRETER_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/language-and-interpreter', () => {
  it('should update contact when language code and interpretation requirement is provided', async () => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContactName.mockResolvedValue(TestData.contact())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/language-and-interpreter`,
      )
      .type('form')
      .send({ language: 'ENG', interpreterRequired: 'NO' })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/10/relationship/987654')

    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      10,
      { languageCode: 'ENG', interpreterRequired: false, updatedBy: 'user1' },
      user,
      expect.any(String),
    )
  })

  it('should return to enter page if there are validation errors', async () => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/language-and-interpreter`,
      )
      .type('form')
      .send({ language: '' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/language-and-interpreter`,
      )

    expect(contactsService.updateContactById).not.toHaveBeenCalled()
  })
})
