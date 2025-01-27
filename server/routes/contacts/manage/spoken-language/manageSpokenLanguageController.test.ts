import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

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
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/language', () => {
  it('should render manage spoken language page', async () => {
    // Given
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact())
    referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/language?returnUrl=/foo-bar`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    const options = $('#languageCode option')

    expect(options.length).toBe(4)
    expect(options.eq(0).text()).toBe('Select')
    expect(options.eq(0).attr('value')).toBe('')
    expect(options.eq(1).text()).toBe('Albanian')
    expect(options.eq(1).attr('value')).toBe('ALB')
    expect(options.eq(2).text()).toBe('Amharic')
    expect(options.eq(2).attr('value')).toBe('AMH')
    expect(options.eq(3).text()).toBe('Arabic')
    expect(options.eq(3).attr('value')).toBe('ARA')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_SPOKEN_LANGUAGE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/language', () => {
  it('should update contact when language code is provided', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/language?returnUrl=/foo-bar`)
      .type('form')
      .send({ languageCode: 'ENG' })
      .expect(302)
      .expect('Location', '/foo-bar')

    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      10,
      { languageCode: 'ENG', updatedBy: 'user1' },
      user,
    )
  })

  it('should update contact with no language when language code is null', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/language?returnUrl=/foo-bar`)
      .type('form')
      .send({ languageCode: '' })
      .expect(302)
      .expect('Location', '/foo-bar')

    expect(contactsService.updateContactById).toHaveBeenCalledWith(10, { languageCode: null, updatedBy: 'user1' }, user)
  })
})
