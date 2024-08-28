import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'

jest.mock('../../../../services/auditService')

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

describe('GET /contacts/create/enter-name', () => {
  it('should render contact page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get('/contacts/create/enter-name')

    // Then
    expect(response.status).toEqual(200)
    expect(response.text).toContain('Contacts')
    expect(response.text).toContain('Hmpps Contacts Ui')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_NAME_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('POST /contacts/create/enter-name', () => {
  it('should pass to success page if there are no validation errors', async () => {
    await request(app)
      .post('/contacts/create/enter-name')
      .type('form')
      .send({ firstName: 'first', lastName: 'last' })
      .expect(302)
      .expect('Location', '/contacts/create/success')
  })
  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post('/contacts/create/enter-name')
      .type('form')
      .send({ firstName: 'first' })
      .expect(302)
      .expect('Location', '/contacts/create/enter-name')
  })
})
