import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import { Page } from '../services/auditService'
import { MockedService } from '../testutils/mockedServices'

jest.mock('../services/auditService')

const auditService = MockedService.AuditService()

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', async () => {
    // Given

    // When
    const response = await request(app).get('/')

    // Then
    expect(response.text).toContain('Contacts')
    expect(response.text).toContain('Hmpps Contacts Ui')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACTS_HOME_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})
