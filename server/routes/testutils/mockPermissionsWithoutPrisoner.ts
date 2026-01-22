import { Express } from 'express'
import { PersonalRelationshipsPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'
import nunjucksSetup from '../../utils/nunjucksSetup'
import * as permissionsUtils from '../../utils/permissionsUtils'
import Permission from '../../enumeration/permission'

/**
 * Mocks the behaviour of the internal permissionsFromRoles util used by
 * checkPermissionsWithoutPrisonerMiddleware for tests, driven entirely by a
 * simple permission map instead of real roles.
 *
 * The real implementation always grants read_contacts and conditionally adds
 * edit-related permissions based on roles. For tests we only care whether a
 * given Permission is treated as granted or not, so we bypass roles and build
 * the Permission[] directly from the provided map.
 */
export default function mockPermissionsWithoutPrisoner(
  app: Express,
  permissions: Record<PersonalRelationshipsPermission, boolean>,
) {
  jest.spyOn(permissionsUtils, 'permissionsFromRoles').mockImplementation((_userRoles: string[]) => {
    const result: Permission[] = []

    // Always include read_contacts, mirroring the real util behaviour.
    result.push(Permission.read_contacts)

    // permissions map is provided using Permission enum keys (or equivalent strings)
    if (permissions[Permission.edit_contacts]) {
      result.push(Permission.edit_contacts)
    }
    if (permissions[Permission.edit_contact_restrictions]) {
      result.push(Permission.edit_contact_restrictions)
    }
    if (permissions[Permission.edit_contact_visit_approval]) {
      result.push(Permission.edit_contact_visit_approval)
    }

    return result
  })

  // Need to reset the isGranted/hasPermission methods in templates so they now
  // use the mocked permissionsFromRoles implementation.
  nunjucksSetup(app)
}
