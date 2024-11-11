import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import ReferenceDataService from '../../../../services/referenceDataService'
import { mockedReferenceData, STUBBED_TITLE_OPTIONS } from '../../../testutils/stubReferenceData'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import TestData from '../../../testutils/testData'
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
const contactId = 99
const prisonerNumber = 'A1234BC'

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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/name', () => {
  it('should render update name page', async () => {
    // Given
    const contact = TestData.contact({ id: contactId })
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/name`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual("What is the contact's name?")
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/manage/99')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/manage/99')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('title options are ordered alphabetically', async () => {
    // Given
    const contact = TestData.contact({ id: contactId })
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/name`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('#title :nth-child(1)').text()).toStrictEqual('')
    expect($('#title :nth-child(2)').text()).toStrictEqual('Brother')
    expect($(`#title :nth-child(${STUBBED_TITLE_OPTIONS.length + 1})`).text()).toStrictEqual('Sister')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    const contact = TestData.contact({ id: contactId })
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/name`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_NAME_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { middleNames: 'middle updated', title: 'DR' }
    const contact = TestData.contact({
      id: contactId,
      firstName: 'first',
      lastName: 'last',
      middleNames: 'middle',
      title: 'MR',
    })
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/name`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#middleNames').val()).toStrictEqual('middle updated')
    expect($('#title').val()).toStrictEqual('DR')
  })

  it('should render contact names on first load', async () => {
    // Given
    const contact = TestData.contact({
      id: contactId,
      firstName: 'first',
      lastName: 'last',
      middleNames: 'middle',
      title: 'MR',
    })
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/name`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#firstName').val()).toStrictEqual('first')
    expect($('#middleNames').val()).toStrictEqual('middle')
    expect($('#lastName').val()).toStrictEqual('last')
    expect($('#title').val()).toStrictEqual('MR')
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/name', () => {
  it('should pass to success page if there are no validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/name`)
      .type('form')
      .send({ middleNames: 'mid', title: 'DR' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    const expectedRequest: PatchContactRequest = {
      title: 'DR',
      middleNames: 'mid',
      updatedBy: user.username,
    }

    expect(contactsService.updateContactById).toHaveBeenCalledWith(contactId, expectedRequest, user)
  })

  it('should return to enter page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/name`)
      .type('form')
      .send({ middleNames: ''.padEnd(36, 'X') })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/name`)
  })
})
