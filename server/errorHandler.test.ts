import type { Express } from 'express'
import request from 'supertest'
import createError from 'http-errors'
import { appWithAllRoutes } from './routes/testutils/appSetup'
import { MockedService } from './testutils/mockedServices'

let app: Express
let productionApp: Express
jest.mock('./services/auditService')
jest.mock('./services/prisonerSearchService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
  })
  productionApp = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
    },
    production: true,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('NotFoundError: Not Found')
        expect(res.text).toContain('Page not found')
      })
  })

  it('should render content without stack in production mode', () => {
    return request(productionApp)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(res.text).not.toContain('NotFoundError: Not Found')
      })
  })
})

describe('GET 500', () => {
  it('should render sorry page with stack in dev mode', () => {
    prisonerSearchService.getByPrisonerNumber.mockRejectedValue(createError.InternalServerError())

    return request(app)
      .get('/prisoner/A1324BC/contacts/list')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('InternalServerError: Internal Server Error')
        expect(res.text).toContain('Sorry, there is a problem with the service')
      })
  })

  it('should render sorry page without stack in production mode', () => {
    prisonerSearchService.getByPrisonerNumber.mockRejectedValue(createError.InternalServerError())

    return request(productionApp)
      .get('/prisoner/A1324BC/contacts/list')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('InternalServerError: Internal Server Error')
        expect(res.text).toContain('Sorry, there is a problem with the service')
      })
  })
})
