import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { mockedReferenceData, STUBBED_DOMESTIC_STATUS_OPTIONS } from '../../../testutils/stubReferenceData'
import { MockedService } from '../../../../testutils/mockedServices'

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
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
  })

  it.each([
    ['C', 'Co-habiting (living with partner)'],
    ['D', 'Divorced or dissolved'],
    ['M', 'Married or in civil partnership'],
    ['N', 'Prefer not to say'],
    ['P', 'Separated-not living with legal partner'],
    ['S', 'Single-not married/in civil partnership'],
    ['W', 'Widowed'],
    ['', ''],
  ])('should render manage domestic status page with status selected', async (code: string, expected: string) => {
    // Given
    contactsService.getContact.mockResolvedValue(TestData.contact({ domesticStatusCode: code }))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status?returnUrl=/foo-bar`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($(`[data-qa=status-${code}-option]`).attr('selected', 'selected').text()).toStrictEqual(expected)

    expect($('#domesticStatusCode :nth-child(1)').text()).toStrictEqual('')
    expect($('#domesticStatusCode :nth-child(2)').text()).toStrictEqual('Single-not married/in civil partnership')
    expect($(`#domesticStatusCode :nth-child(${STUBBED_DOMESTIC_STATUS_OPTIONS.length + 1})`).text()).toStrictEqual(
      'Prefer not to say',
    )
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_DOMESTIC_STATUS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/domestic-status', () => {
  it('should update contact when domestic status is selected', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/domestic-status?returnUrl=/foo-bar`)
      .type('form')
      .send({ domesticStatusCode: 'S' })
      .expect(302)
      .expect('Location', '/foo-bar')

    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      10,
      { domesticStatus: 'S', updatedBy: 'user1' },
      user,
    )
  })
})
