import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import { MockedService } from '../../testutils/mockedServices'

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      prisonerSearchService,
    },
  })
})

afterEach(() => jest.resetAllMocks())

describe('GET /', () => {
  it('should render the index page', async () => {
    const response = await request(app).get('/')
    const $ = cheerio.load(response.text)

    expect(response.status).toBe(200)
    expect($('h1.govuk-heading-l').text().trim()).toBe('Contacts')
  })
})
