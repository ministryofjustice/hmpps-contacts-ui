import Permission from '../enumeration/permission'
import { HmppsUser } from '../interfaces/hmppsUser'
import AuthorisedRoles from '../enumeration/authorisedRoles'

const ADMIN_USER_ROLE = stripRole(AuthorisedRoles.ROLE_CONTACTS_ADMINISTRATOR)
const AUTHORISER_USER_ROLE = stripRole(AuthorisedRoles.ROLE_CONTACTS_AUTHORISER)

// HmppsUser.userRoles has the ROLE_ prefixed stripped
function stripRole(role: string): string {
  return role.substring(role.indexOf('_') + 1)
}
// This is a temporary fix until permission handling without a prisoner is implemented in the permission library
function permissionsFromRoles(userRoles: string[]): Permission[] {
  const permissions: Permission[] = [Permission.read_contacts]
  if (userRoles.includes(ADMIN_USER_ROLE) || userRoles.includes(AUTHORISER_USER_ROLE)) {
    permissions.push(Permission.edit_contacts)
  }
  if (userRoles.includes(AUTHORISER_USER_ROLE)) {
    permissions.push(Permission.edit_contact_restrictions, Permission.edit_contact_visit_approval)
  }
  return permissions
}

function hasPermission(user: HmppsUser, permission: Permission): boolean {
  if (!user) return false
  return permissionsFromRoles(user.userRoles).includes(permission)
}

export { permissionsFromRoles, hasPermission }
