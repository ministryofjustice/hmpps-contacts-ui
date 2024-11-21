import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { components } from '../../../../../@types/contactsApi'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import ContactService from '../../../../../services/contactsService'
import TestData from '../../../../testutils/testData'
import ContactDetails = contactsApiClientTypes.ContactDetails

type UpdateEmailRequest = components['schemas']['UpdateEmailRequest']

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactService(null) as jest.Mocked<ContactService>

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 987654
const contact: ContactDetails = {
  id: contactId,
  title: '',
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  emailAddresses: [
    {
      contactEmailId: 6,
      contactId: 20000000,
      emailAddress: 'mr.first@example.com',
      createdBy: user.username,
      createdTime: '2024-11-15T20:00:34.498693',
      updatedBy: user.username,
      updatedTime: '2024-11-18T11:17:15.722593',
    },
  ],
  createdBy: user.username,
  createdTime: '2024-01-01',
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/edit', () => {
  it('should render edit email page with navigation back to manage contact and all field populated', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/6/edit?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What is the email address for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('#emailAddress').val()).toStrictEqual('mr.first@example.com')
  })

  it('should render edited answer instead of original if there is a validation error', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)
    const form = { emailAddress: 'name@' }
    auditService.logPageView.mockResolvedValue(null)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/6/edit?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What is the email address for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('#emailAddress').val()).toStrictEqual('name@')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/6/edit?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_EDIT_EMAIL_ADDRESSES_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should raise an error if the contact email is missing', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/600/edit?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(500)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/edit', () => {
  it('should edit mail and pass to manage contact details page if there are no validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/6/edit?returnUrl=/foo-bar`)
      .type('form')
      .send({ emailAddress: 'test@example.com' })
      .expect(302)
      .expect('Location', '/foo-bar')

    const requestBody: UpdateEmailRequest = {
      emailAddress: 'test@example.com',
      updatedBy: 'FIRST LAST',
    }
    expect(contactsService.updateContactEmail).toHaveBeenCalledWith(contactId, 6, requestBody, user)
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/6/edit?returnUrl=/foo-bar`)
      .type('form')
      .send({ emailAddress: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/6/edit?returnUrl=/foo-bar`)
    expect(contactsService.updateContactEmail).not.toHaveBeenCalled()
  })
})
