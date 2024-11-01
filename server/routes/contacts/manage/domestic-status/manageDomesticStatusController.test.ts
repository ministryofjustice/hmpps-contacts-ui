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

  test.each([
    ['YES', { isStaff: true }],
    ['NO', { isStaff: false }],
  ])('should render manage staff page when isStaff is %p', async (isStaff, expectedResponse) => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(TestData.contact(expectedResponse))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/staff`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('input[type=radio]:checked').val()).toStrictEqual(isStaff)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_UPDATE_STAFF_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it.each([
    ['C', 'Co-habiting (living with partner)'],
    ['D', 'Divorced or dissolved'],
    ['M', 'Married or in civil partnership'],
    ['N', 'Prefer not to say'],
    ['P', 'Separated-not living with legal partner'],
    ['S', 'Single-not married/in civil partnership'],
    ['W', 'Widowed'],
  ])('should render manage domestic status page with status selected', async (code: string, expected: string) => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: code }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status`)
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($(`[data-qa=status-${code}-option]`).attr('selected', 'selected').text()).toStrictEqual(expected)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_DOMESTIC_STATUS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
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
