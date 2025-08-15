import { Express, Request, Response } from 'express'
import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import checkPermissionsMiddleware from './checkPermissionsMiddleware'
import Permission from '../enumeration/permission'
import mockPermissions from '../routes/testutils/mockPermissions'
import { appWithAllRoutes, basicPrisonUser } from '../routes/testutils/appSetup'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

describe('checkPermissionsMiddleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let status: jest.Mock
  let render: jest.Mock
  let next: jest.Mock
  let app: Express
  let permissionsService: PermissionsService

  beforeEach(() => {
    status = jest.fn()
    render = jest.fn()
    next = jest.fn()
    req = {}
    res = {
      locals: {
        user: {
          username: 'test-user',
        },
      },
      render,
      status,
    } as unknown as Response

    app = appWithAllRoutes({
      services: {},
      userSupplier: () => basicPrisonUser,
    })

    permissionsService = undefined as unknown as PermissionsService

    status.mockReturnValue(res)
  })

  it.each([
    Permission.read_contacts,
    Permission.edit_contacts,
    Permission.edit_contact_restrictions,
    Permission.edit_contact_visit_approval,
  ])('should call next() if the user has required permission (%s)', async (requiredPermission: Permission) => {
    mockPermissions(app, { [requiredPermission]: true })

    const middleware = checkPermissionsMiddleware(permissionsService, requiredPermission)
    await middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalled()
  })

  it.each([
    Permission.read_contacts,
    Permission.edit_contacts,
    Permission.edit_contact_restrictions,
    Permission.edit_contact_visit_approval,
  ])(
    'should render not found page with a 403 response so that the unauthorised access is logged',
    async (requiredPermission: Permission) => {
      mockPermissions(app, { [requiredPermission]: false })

      const middleware = checkPermissionsMiddleware(permissionsService, requiredPermission)
      await middleware(req as Request, res as Response, next)

      expect(next).not.toHaveBeenCalled()
      expect(status).toHaveBeenCalledWith(403)
      expect(render).toHaveBeenCalledWith('pages/errors/notFound')
    },
  )
})
