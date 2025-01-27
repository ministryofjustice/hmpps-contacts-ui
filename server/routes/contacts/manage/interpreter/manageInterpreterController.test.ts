import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
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
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/interpreter', () => {
  it('should render manage interpreter page', async () => {
    // Given
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(TestData.contact())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/interpreter?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_INTERPRETER_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    const $ = cheerio.load(response.text)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/interpreter', () => {
  it('should update contact when interpreter is true', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/interpreter?returnUrl=/foo-bar`)
      .type('form')
      .send({ interpreterRequired: 'YES' })
      .expect(302)
      .expect('Location', '/foo-bar')

    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      10,
      { interpreterRequired: true, updatedBy: 'user1' },
      user,
    )
  })

  it('should update contact when interpreter is false', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/interpreter?returnUrl=/foo-bar`)
      .type('form')
      .send({ interpreterRequired: 'NO' })
      .expect(302)
      .expect('Location', '/foo-bar')

    expect(contactsService.updateContactById).toHaveBeenCalledWith(
      10,
      { interpreterRequired: false, updatedBy: 'user1' },
      user,
    )
  })
})
