import Permission from '../enumeration/permission'
import { hasPermission, permissionsFromRoles } from './permissionsUtils'
import { HmppsUser } from '../interfaces/hmppsUser'

describe('permissionUtils', () => {
  describe('permissionsFromRoles', () => {
    it.each([
      [['PRISON'], [Permission.VIEW_CONTACT_LIST]],
      [
        ['PRISON', 'CONTACTS_ADMINISTRATOR'],
        [Permission.VIEW_CONTACT_LIST, Permission.MANAGE_CONTACTS],
      ],
      [
        ['PRISON', 'CONTACTS_AUTHORISER'],
        [
          Permission.VIEW_CONTACT_LIST,
          Permission.MANAGE_CONTACTS,
          Permission.MANAGE_RESTRICTIONS,
          Permission.APPROVE_TO_VISIT,
        ],
      ],
      [
        ['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'],
        [
          Permission.VIEW_CONTACT_LIST,
          Permission.MANAGE_CONTACTS,
          Permission.MANAGE_RESTRICTIONS,
          Permission.APPROVE_TO_VISIT,
        ],
      ],
    ])('should return correct permissions for roles', (userRoles: string[], expectedPermissions: Permission[]) => {
      expect(permissionsFromRoles(userRoles)).toStrictEqual(expectedPermissions)
    })
  })

  describe('hasPermission', () => {
    it.each([
      // general user
      [['PRISON'], Permission.VIEW_CONTACT_LIST, true],
      [['PRISON'], Permission.MANAGE_CONTACTS, false],
      [['PRISON'], Permission.MANAGE_RESTRICTIONS, false],
      [['PRISON'], Permission.APPROVE_TO_VISIT, false],
      // contacts admin
      [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.MANAGE_CONTACTS, true],
      [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.MANAGE_RESTRICTIONS, false],
      [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.APPROVE_TO_VISIT, false],
      // contacts authoriser
      [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.MANAGE_RESTRICTIONS, true],
      [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.APPROVE_TO_VISIT, true],
      [['PRISON', 'CONTACTS_AUTHORISER'], Permission.MANAGE_RESTRICTIONS, true],
      [['PRISON', 'CONTACTS_AUTHORISER'], Permission.APPROVE_TO_VISIT, true],
    ])(
      'should return correct permissions for roles (%s, %s)',
      (userRoles: string[], permission: Permission, expected: boolean) => {
        const user = {
          username: 'foo',
          userRoles,
        } as unknown as HmppsUser
        expect(hasPermission(user, permission)).toStrictEqual(expected)
      },
    )
  })
})
