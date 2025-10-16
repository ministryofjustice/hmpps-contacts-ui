import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, basicPrisonUser } from './testutils/appSetup'
import { MockedService } from '../testutils/mockedServices'

jest.mock('../services/auditService')
jest.mock('../services/contactsService')
jest.mock('../services/alertsService')

const contactsService = MockedService.ContactsService()
const alertsService = MockedService.AlertsService()
const auditService = MockedService.AuditService()

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      alertsService,
      contactsService,
    },
    userSupplier: () => basicPrisonUser,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('The entry point is contact list so default page should show a 404', async () => {
    await request(app)
      .get('/')
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
