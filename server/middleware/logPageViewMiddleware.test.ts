import { Request, Response, NextFunction } from 'express'
import logPageViewMiddleware from './logPageViewMiddleware'
import AuditService from '../services/auditService'
import { PageHandler } from '../interfaces/pageHandler'

describe('logPageViewMiddleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock<NextFunction>
  let auditService: jest.Mocked<AuditService>
  let pageHandler: jest.Mocked<PageHandler>
  let middleware: ReturnType<typeof logPageViewMiddleware>

  beforeEach(() => {
    req = {
      originalUrl: '',
      id: 'correlation-123',
    }
    res = {
      statusCode: 200,
      locals: {
        user: {
          username: 'test-user',
        },
      },
    } as Partial<Response>
    next = jest.fn()
    auditService = {
      logPageView: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>
    pageHandler = {
      PAGE_NAME: 'TEST_PAGE',
    } as unknown as jest.Mocked<PageHandler>
    middleware = logPageViewMiddleware(auditService, pageHandler)
  })

  it('should call next() immediately if status code is not 200', async () => {
    res.statusCode = 404
    await middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalled()
    expect(auditService.logPageView).not.toHaveBeenCalled()
  })

  it('should extract contact ID from URL and log page view', async () => {
    req.originalUrl = '/contacts/123/details'

    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        contactId: '123',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should extract contact ID from URL and log page view with contacts/manage', async () => {
    req.originalUrl = '/contacts/manage/123/details'

    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        contactId: '123',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should extract contact ID from URL and log page view with contacts/add/match', async () => {
    req.originalUrl = '/contacts/add/match/123/details'

    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        contactId: '123',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should extract prisoner number from URL and log page view', async () => {
    req.originalUrl = '/prisoner/A1234BC/details'

    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should extract prisoner contact ID from URL and log page view', async () => {
    req.originalUrl = '/relationship/CONTACT123/details'

    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        prisonerContactId: 'CONTACT123',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should extract prisoner contact ID from URL and log page view with prisoner-contact', async () => {
    req.originalUrl = '/prisoner-contact/CONTACT123/details'

    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        prisonerContactId: 'CONTACT123',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should handle multiple parameters in URL', async () => {
    req.originalUrl =
      '/contacts/123/prisoner/A1234BC/relationship/CONTACT123/check-employer/abc123-def456/source?organisationId=ORG123'

    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        contactId: '123',
        prisonerNumber: 'A1234BC',
        prisonerContactId: 'CONTACT123',
        organisationId: 'ORG123',
        employerId: 'abc123-def456',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should handle URLs with no matching parameters', async () => {
    req.originalUrl = '/some/other/path'

    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {},
    })
    expect(next).toHaveBeenCalled()
  })

  it('should log page view with employer ID with check employer', async () => {
    req.originalUrl = '/check-employer/abc123-def456/'
    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        employerId: 'abc123-def456',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should log page view with employer ID with delete emplyment', async () => {
    req.originalUrl = '/delete-employment/abc123-def456/'
    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        employerId: 'abc123-def456',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should log page view with employer ID with update employment', async () => {
    req.originalUrl = '/update-employments/abc123-def456/'
    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        employerId: 'abc123-def456',
      },
    })
    expect(next).toHaveBeenCalled()
  })

  it('should log page view with organisation ID', async () => {
    req.originalUrl = '/some-path?organisationId=org123'
    await middleware(req as Request, res as Response, next)

    expect(auditService.logPageView).toHaveBeenCalledWith('TEST_PAGE', {
      who: 'test-user',
      correlationId: 'correlation-123',
      details: {
        organisationId: 'org123',
      },
    })
    expect(next).toHaveBeenCalled()
  })
})
