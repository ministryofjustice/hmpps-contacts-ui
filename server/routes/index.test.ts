import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, flashProvider, user } from './testutils/appSetup'
import AuditService, { Page } from '../services/auditService'

jest.mock('../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

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
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get('/')

    // Then
    expect(response.text).toContain('Contacts')
    expect(response.text).toContain('Hmpps Contacts Ui')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SEARCH_PRISONER_CONTACT_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('GET /search/prisoner', () => {
  it('should render search page', async () => {
    // Given
    flashProvider.mockReturnValue({ search: [''] })
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get('/search/prisoner')

    // Then
    expect(response.text).toContain('Manage Contacts')
    expect(response.text).toContain('Search for a prisoner')
  })
})
