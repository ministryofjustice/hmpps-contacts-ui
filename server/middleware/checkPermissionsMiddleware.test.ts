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
    [['PRISON'], Permission.read_contacts],
    [['CONTACTS_ADMINISTRATOR'], Permission.read_contacts],
    [['CONTACTS_AUTHORISER'], Permission.read_contacts],
    [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.read_contacts],
    [['PRISON', 'CONTACTS_AUTHORISER'], Permission.read_contacts],
    [['CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.read_contacts],
    [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.read_contacts],
    // only admin or authoriser
    [['CONTACTS_ADMINISTRATOR'], Permission.edit_contacts],
    [['CONTACTS_AUTHORISER'], Permission.edit_contacts],
    [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.edit_contacts],
    [['PRISON', 'CONTACTS_AUTHORISER'], Permission.edit_contacts],
    [['CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.edit_contacts],
    [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.edit_contacts],
    // only authoriser
    [['CONTACTS_AUTHORISER'], Permission.edit_contact_restrictions],
    [['PRISON', 'CONTACTS_AUTHORISER'], Permission.edit_contact_restrictions],
    [['CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.edit_contact_restrictions],
    [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.edit_contact_restrictions],
    [['CONTACTS_AUTHORISER'], Permission.edit_contact_visit_approval],
    [['PRISON', 'CONTACTS_AUTHORISER'], Permission.edit_contact_visit_approval],
    [['CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.edit_contact_visit_approval],
    [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.edit_contact_visit_approval],
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
    [['PRISON'], Permission.edit_contacts],
    [['PRISON'], Permission.edit_contact_restrictions],
    [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.edit_contact_restrictions],
    [['CONTACTS_ADMINISTRATOR'], Permission.edit_contact_restrictions],
    [['PRISON'], Permission.edit_contact_visit_approval],
    [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.edit_contact_visit_approval],
    [['CONTACTS_ADMINISTRATOR'], Permission.edit_contact_visit_approval],
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
