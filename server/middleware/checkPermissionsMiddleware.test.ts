import { Request, Response } from 'express'
import checkPermissionsMiddleware from './checkPermissionsMiddleware'
import Permission from '../enumeration/permission'

describe('checkPermissionsMiddleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let status: jest.Mock
  let render: jest.Mock
  let next: jest.Mock

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
    status.mockReturnValue(res)
  })

  it.each([
    // everyone can access
    [['PRISON'], Permission.VIEW_CONTACT_LIST],
    [['CONTACTS_ADMINISTRATOR'], Permission.VIEW_CONTACT_LIST],
    [['CONTACTS_AUTHORISER'], Permission.VIEW_CONTACT_LIST],
    [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.VIEW_CONTACT_LIST],
    [['PRISON', 'CONTACTS_AUTHORISER'], Permission.VIEW_CONTACT_LIST],
    [['CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.VIEW_CONTACT_LIST],
    [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.VIEW_CONTACT_LIST],
    // only admin or authoriser
    [['CONTACTS_ADMINISTRATOR'], Permission.MANAGE_CONTACTS],
    [['CONTACTS_AUTHORISER'], Permission.MANAGE_CONTACTS],
    [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.MANAGE_CONTACTS],
    [['PRISON', 'CONTACTS_AUTHORISER'], Permission.MANAGE_CONTACTS],
    [['CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.MANAGE_CONTACTS],
    [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.MANAGE_CONTACTS],
    // only authoriser
    [['CONTACTS_AUTHORISER'], Permission.MANAGE_RESTRICTIONS],
    [['PRISON', 'CONTACTS_AUTHORISER'], Permission.MANAGE_RESTRICTIONS],
    [['CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.MANAGE_RESTRICTIONS],
    [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.MANAGE_RESTRICTIONS],
    [['CONTACTS_AUTHORISER'], Permission.APPROVE_TO_VISIT],
    [['PRISON', 'CONTACTS_AUTHORISER'], Permission.APPROVE_TO_VISIT],
    [['CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.APPROVE_TO_VISIT],
    [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.APPROVE_TO_VISIT],
  ])(
    'should call next() if the user has required permission (%s, %s)',
    async (userRoles: string[], requiredPermission: Permission) => {
      res.locals!.user!.userRoles = userRoles
      const middleware = checkPermissionsMiddleware(requiredPermission)
      res.statusCode = 404
      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    },
  )

  it.each([
    [['PRISON'], Permission.MANAGE_CONTACTS],
    [['PRISON'], Permission.MANAGE_RESTRICTIONS],
    [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.MANAGE_RESTRICTIONS],
    [['CONTACTS_ADMINISTRATOR'], Permission.MANAGE_RESTRICTIONS],
    [['PRISON'], Permission.APPROVE_TO_VISIT],
    [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.APPROVE_TO_VISIT],
    [['CONTACTS_ADMINISTRATOR'], Permission.APPROVE_TO_VISIT],
  ])(
    'should render not found page with a 403 response so that the unauthorised access is logged',
    async (userRoles: string[], requiredPermission: Permission) => {
      const middleware = checkPermissionsMiddleware(requiredPermission)
      await middleware(req as Request, res as Response, next)
      expect(next).not.toHaveBeenCalled()
      expect(status).toHaveBeenCalledWith(403)
      expect(render).toHaveBeenCalledWith('pages/errors/notFound')
    },
  )
})
