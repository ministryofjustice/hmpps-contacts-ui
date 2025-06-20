import Permission from '../enumeration/permission'
import { hasPermission, permissionsFromRoles } from './permissionsUtils'
import { HmppsUser } from '../interfaces/hmppsUser'

describe('permissionUtils', () => {
  describe('permissionsFromRoles', () => {
    it.each([
      [['PRISON'], [Permission.PRISONER_SEARCH, Permission.VIEW_CONTACT_LIST]],
      [
        ['PRISON', 'CONTACTS_ADMINISTRATOR'],
        [Permission.PRISONER_SEARCH, Permission.VIEW_CONTACT_LIST, Permission.MANAGE_CONTACTS],
      ],
      [
        ['PRISON', 'CONTACTS_AUTHORISER'],
        [
          Permission.PRISONER_SEARCH,
          Permission.VIEW_CONTACT_LIST,
          Permission.MANAGE_CONTACTS,
          Permission.MANAGE_RESTRICTIONS,
          Permission.APPROVE_TO_VISIT,
        ],
      ],
      [
        ['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'],
        [
          Permission.PRISONER_SEARCH,
          Permission.VIEW_CONTACT_LIST,
          Permission.MANAGE_CONTACTS,
          Permission.MANAGE_RESTRICTIONS,
          Permission.APPROVE_TO_VISIT,
        ],
      ],
    ])('should return correct permissions for roles', (userRoles: string[], expectedPermissions: Permission[]) => {
      const user = {
        username: 'foo',
        userRoles,
        caseLoads: [
          {
            caseLoadId: 'BXI',
          },
        ],
        activeCaseLoad: {
          caseLoadId: 'BXI',
        },
        activeCaseLoadId: 'BXI',
      } as unknown as HmppsUser
      const prisonerDetails = {
        prisonerNumber: 'A1234BC',
        lastName: 'First',
        firstName: 'Last',
        dateOfBirth: '2010-06-21',
        prisonName: 'Brixton',
        prisonId: 'BXI',
        cellLocation: 'C1',
        hasPrimaryAddress: false,
      }
      expect(permissionsFromRoles(user, prisonerDetails)).toStrictEqual(expectedPermissions)
    })

    it('should allow view contact list but not edit if the user has global search even if not in the users caseload', () => {
      const user = {
        username: 'foo',
        userRoles: ['PRISON', 'GLOBAL_SEARCH', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'],
        caseLoads: [
          {
            caseLoadId: 'BXI',
          },
        ],
        activeCaseLoad: {
          caseLoadId: 'BXI',
        },
        activeCaseLoadId: 'BXI',
      } as unknown as HmppsUser
      const prisonerDetails = {
        prisonerNumber: 'A1234BC',
        lastName: 'First',
        firstName: 'Last',
        dateOfBirth: '2010-06-21',
        prisonName: 'Brixton',
        prisonId: 'OTHER',
        cellLocation: 'C1',
        hasPrimaryAddress: false,
      }
      expect(permissionsFromRoles(user, prisonerDetails)).toStrictEqual([
        Permission.PRISONER_SEARCH,
        Permission.VIEW_CONTACT_LIST,
      ])
    })

    it('should allow view contact list but not edit if the user has the prison in a non-active caseload', () => {
      const user = {
        username: 'foo',
        userRoles: ['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'],
        caseLoads: [
          {
            caseLoadId: 'BXI',
          },
          {
            caseLoadId: 'OTHER',
          },
        ],
        activeCaseLoad: {
          caseLoadId: 'BXI',
        },
        activeCaseLoadId: 'BXI',
      } as unknown as HmppsUser
      const prisonerDetails = {
        prisonerNumber: 'A1234BC',
        lastName: 'First',
        firstName: 'Last',
        dateOfBirth: '2010-06-21',
        prisonName: 'Brixton',
        prisonId: 'OTHER',
        cellLocation: 'C1',
        hasPrimaryAddress: false,
      }
      expect(permissionsFromRoles(user, prisonerDetails)).toStrictEqual([
        Permission.PRISONER_SEARCH,
        Permission.VIEW_CONTACT_LIST,
      ])
    })

    it('should not allow access if not in other caseloads and without global search even with admin roles', () => {
      const user = {
        username: 'foo',
        userRoles: [['PRISON', 'CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER']],
        caseLoads: [
          {
            caseLoadId: 'BXI',
          },
        ],
        activeCaseLoad: {
          caseLoadId: 'BXI',
        },
        activeCaseLoadId: 'BXI',
      } as unknown as HmppsUser
      const prisonerDetails = {
        prisonerNumber: 'A1234BC',
        lastName: 'First',
        firstName: 'Last',
        dateOfBirth: '2010-06-21',
        prisonName: 'Brixton',
        prisonId: 'OTHER',
        cellLocation: 'C1',
        hasPrimaryAddress: false,
      }
      expect(permissionsFromRoles(user, prisonerDetails)).toStrictEqual([Permission.PRISONER_SEARCH])
      // TODO expect audit service to have been called
    })
  })

  describe('hasPermission', () => {
    it.each([
      // general user
      [['PRISON'], Permission.PRISONER_SEARCH, true],
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
          caseLoads: [
            {
              caseLoadId: 'BXI',
            },
          ],
          activeCaseLoad: {
            caseLoadId: 'BXI',
          },
          activeCaseLoadId: 'BXI',
        } as unknown as HmppsUser
        const prisonerDetails = {
          prisonerNumber: 'A1234BC',
          lastName: 'First',
          firstName: 'Last',
          dateOfBirth: '2010-06-21',
          prisonName: 'Brixton',
          prisonId: 'BXI',
          cellLocation: 'C1',
          hasPrimaryAddress: false,
        }
        expect(hasPermission(user, permission, prisonerDetails)).toStrictEqual(expected)
      },
    )
  })
})
