import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, authorisingUser } from '../testutils/appSetup'
import { MockedService } from '../../testutils/mockedServices'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
const currentUser = authorisingUser
beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      prisonerSearchService,
    },
    userSupplier: () => currentUser,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /how-to-manage-a-prisoners-contacts', () => {
  it('should render the page with correct title and heading', async () => {
    const response = await request(app).get('/how-to-manage-a-prisoners-contacts')
    const $ = cheerio.load(response.text)

    expect(response.status).toEqual(200)
    expect($('title').text()).toStrictEqual('How to manage a prisoner’s contacts - Contacts - DPS')
    expect($('[data-qa=main-heading]').text().trim()).toEqual('How to manage a prisoner’s contacts')
    expect($('[data-qa=sub-heading-1]').text().trim()).toEqual("To manage a prisoner's contacts")
    expect($('[data-qa=sub-heading-2]').text().trim()).toEqual('Roles you need to manage a prisoner’s contacts')
  })
})
