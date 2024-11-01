import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import ReferenceDataService from '../../../../services/referenceDataService'
import TestData from '../../../testutils/testData'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = '10'

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
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/domestic-status', () => {
  beforeEach(() => {
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
  })
  it('should render manage domestic status page with status S selected', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: 'S' }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('[data-qa=status-S-option]').attr('selected', 'selected').text()).toStrictEqual(
      'Single-not married/in civil partnership',
    )
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_DOMESTIC_STATUS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render manage domestic status page with status C selected', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: 'C' }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('[data-qa=status-C-option]').attr('selected', 'selected').text()).toStrictEqual(
      'Co-habiting (living with partner)',
    )
  })

  it('should render manage domestic status page with status M selected', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: 'M' }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('[data-qa=status-M-option]').attr('selected', 'selected').text()).toStrictEqual(
      'Married or in civil partnership',
    )
  })

  it('should render manage domestic status page with status N selected', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: 'N' }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('[data-qa=status-N-option]').attr('selected', 'selected').text()).toStrictEqual('Prefer not to say')
  })

  it('should render manage domestic status page with status P selected', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: 'P' }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('[data-qa=status-P-option]').attr('selected', 'selected').text()).toStrictEqual(
      'Separated-not living with legal partner',
    )
  })

  it('should render manage domestic status page with status S selected', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: 'S' }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('[data-qa=status-S-option]').attr('selected', 'selected').text()).toStrictEqual(
      'Single-not married/in civil partnership',
    )
  })

  it('should render manage domestic status page with status W selected', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: 'W' }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('[data-qa=status-W-option]').attr('selected', 'selected').text()).toStrictEqual('Widowed')
  })

  it('should render manage domestic status page with status W selected', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: null }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('option:eq(0)').attr('selected', 'selected').text()).toStrictEqual('')
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/domestic-status', () => {
  it('should update contact when domestic status is selected', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
      .type('form')
      .send({ domesticStatusCode: 'S' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    expect(contactsService.updateContactById).toHaveBeenCalledWith(10, { domesticStatus: 'S', updatedBy: 'id' }, user)
  })
})
