import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import ContactService from '../../../../../services/contactsService'
import TestData from '../../../../testutils/testData'
import ContactDetails = contactsApiClientTypes.ContactDetails

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactService(null) as jest.Mocked<ContactService>

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 987654
const contact: ContactDetails = {
  id: contactId,
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  identities: [
    TestData.getContactIdentityDetails('DL', 'Driving licence', 'LAST-87736799M', 'UK', 1, true),
    TestData.getContactIdentityDetails('PASS', 'Passport number', '425362965', 'UK passport office', 2, true),
    TestData.getContactIdentityDetails('NINO', 'National insurance number', '06/614465M', 'UK', 3, true),
  ],
  createdBy: user.username,
  createdTime: '2024-01-01',
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/edit', () => {
  it('should render edit identity number page with navigation back to manage contact and all field populated', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/1/edit?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What is the identity number for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('#identity').val()).toStrictEqual('LAST-87736799M')
    expect($('#type').val()).toStrictEqual('DL')
    expect($('#issuingAuthority').val()).toStrictEqual('UK')
  })

  it('should render edited answers instead of original if there is a validation error', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)
    const form = { identity: '425362965', type: 'PASS', issuingAuthority: 'UK' }
    auditService.logPageView.mockResolvedValue(null)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/1/edit?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What is the identity number for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('#identity').val()).toStrictEqual('425362965')
    expect($('#type').val()).toStrictEqual('PASS')
    expect($('#issuingAuthority').val()).toStrictEqual('UK')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/1/edit?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_EDIT_IDENTITY_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should raise an error if the contact identity number is missing', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/555/edit?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(500)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/edit', () => {
  it('should edit identity number with issuing authority and pass to manage contact details page if there are no validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/999/edit?returnUrl=/foo-bar`)
      .type('form')
      .send({ type: 'MOB', identity: '123456789', issuingAuthority: '000' })
      .expect(302)
      .expect('Location', '/foo-bar')

    expect(contactsService.updateContactIdentity).toHaveBeenCalledWith(contactId, 999, user, 'MOB', '123456789', '000')
  })

  it('should edit identity number without issuing authority and pass to manage contact details page if there are no validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/999/edit?returnUrl=/foo-bar`)
      .type('form')
      .send({ type: 'MOB', identity: '123456789', issuingAuthority: '' })
      .expect(302)
      .expect('Location', '/foo-bar')

    expect(contactsService.updateContactIdentity).toHaveBeenCalledWith(
      contactId,
      999,
      user,
      'MOB',
      '123456789',
      undefined,
    )
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/999/edit?returnUrl=/foo-bar`)
      .type('form')
      .send({ type: '' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/identity/999/edit?returnUrl=/foo-bar`,
      )
    expect(contactsService.updateContactIdentity).not.toHaveBeenCalled()
  })
})
