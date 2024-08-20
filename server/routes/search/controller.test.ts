import type { Express, Locals } from 'express'
import request from 'supertest'
import { appWithAllRoutes, flashProvider, user } from '../testutils/appSetup'
import AuditService, { Page } from '../../services/auditService'
import SEARCH_PRISONER_URL from '../urls'
import { ENTER_TWO_CHARS_MIN } from './schema'

jest.mock('../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express
let validationErrors: Locals['validationErrors']

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    validationErrors,
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /search/prisoner', () => {
  it('should render search prisoner page', async () => {
    // Given
    flashProvider.mockReturnValue({ search: [''] })
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(SEARCH_PRISONER_URL)

    // Then
    expect(response.status).toEqual(200)
    expect(response.text).toContain('Manage Contacts')
    expect(response.text).toContain('Search for a prisoner')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXAMPLE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render search prisoner page', async () => {
    // Given
    flashProvider.mockReturnValue({ search: [''] })
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(SEARCH_PRISONER_URL)

    // Then
    expect(response.status).toEqual(200)
    expect(response.text).toContain('Manage Contacts')
    expect(response.text).toContain('Search for a prisoner')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXAMPLE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /search/prisoner', () => {
  it('should submit the form when validation passed', async () => {
    // Given
    flashProvider.mockReturnValue({ search: [''] })
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).post(SEARCH_PRISONER_URL).send({ search: 'Prisoner' })

    // Then
    expect(response.status).toEqual(302)
    expect(flashProvider).not.toHaveBeenCalled()
  })

  it('should not submit the form when validation failed', async () => {
    // Given
    flashProvider.mockReturnValue({ search: [ENTER_TWO_CHARS_MIN] })
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).post('/search/prisoner').send({ search: '' })

    // Then
    expect(response.status).toEqual(302)
    expect(flashProvider).toHaveBeenCalledWith('validationErrors', `{"search":["${ENTER_TWO_CHARS_MIN}"]}`)
  })
})
