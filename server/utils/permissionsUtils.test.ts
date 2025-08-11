import Permission from '../enumeration/permission'
import { hasPermission, permissionsFromRoles, hasRole } from './permissionsUtils'
import { HmppsUser } from '../interfaces/hmppsUser'

describe('permissionUtils', () => {
  describe('permissionsFromRoles', () => {
    it.each([
      [['PRISON'], [Permission.read_contacts]],
      [
        ['PRISON', 'CONTACTS_ADMINISTRATOR'],
        [Permission.read_contacts, Permission.edit_contacts],
      ],
      [
        ['PRISON', 'CONTACTS_AUTHORISER'],
        [
          Permission.read_contacts,
          Permission.edit_contacts,
          Permission.edit_contact_restrictions,
          Permission.edit_contact_visit_approval,
        ],
      ],
      [
        ['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'],
        [
          Permission.read_contacts,
          Permission.edit_contacts,
          Permission.edit_contact_restrictions,
          Permission.edit_contact_visit_approval,
        ],
      ],
    ])('should return correct permissions for roles', (userRoles: string[], expectedPermissions: Permission[]) => {
      expect(permissionsFromRoles(userRoles)).toStrictEqual(expectedPermissions)
    })
  })

  describe('hasPermission', () => {
    it.each([
      // general user
      [['PRISON'], Permission.read_contacts, true],
      [['PRISON'], Permission.edit_contacts, false],
      [['PRISON'], Permission.edit_contact_restrictions, false],
      [['PRISON'], Permission.edit_contact_visit_approval, false],
      // contacts admin
      [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.edit_contacts, true],
      [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.edit_contact_restrictions, false],
      [['PRISON', 'CONTACTS_ADMINISTRATOR'], Permission.edit_contact_visit_approval, false],
      // contacts authoriser
      [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.edit_contact_restrictions, true],
      [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'], Permission.edit_contact_visit_approval, true],
      [['PRISON', 'CONTACTS_AUTHORISER'], Permission.edit_contact_restrictions, true],
      [['PRISON', 'CONTACTS_AUTHORISER'], Permission.edit_contact_visit_approval, true],
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

  describe('hasRole', () => {
    it.each([
      [['ROLE_PRISON'], 'ROLE_PRISON', true],
      [['ROLE_PRISON'], 'ROLE_CONTACTS_ADMINISTRATOR', false],
      [['ROLE_PRISON', 'ROLE_CONTACTS_ADMINISTRATOR'], 'ROLE_CONTACTS_ADMINISTRATOR', true],
      [['ROLE_PRISON', 'ROLE_CONTACTS_ADMINISTRATOR'], 'ROLE_CONTACTS_AUTHORISER', false],
      [['ROLE_PRISON', 'ROLE_CONTACTS_ADMINISTRATOR', 'ROLE_CONTACTS_AUTHORISER'], 'ROLE_CONTACTS_AUTHORISER', true],
    ])('should return correct role for roles (%s, %s)', (userRoles: string[], role: string, expected: boolean) => {
      const user = {
        username: 'foo',
        userRoles,
      } as unknown as HmppsUser
      expect(hasRole(user, role)).toStrictEqual(expected)
    })
  })
})
