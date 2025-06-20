import Permission from '../enumeration/permission'
import { HmppsUser } from '../interfaces/hmppsUser'
import AuthorisedRoles from '../enumeration/authorisedRoles'
import { PrisonerDetails } from '../@types/journeys'

const ADMIN_USER_ROLE = stripRole(AuthorisedRoles.ROLE_CONTACTS_ADMINISTRATOR)
const AUTHORISER_USER_ROLE = stripRole(AuthorisedRoles.ROLE_CONTACTS_AUTHORISER)
const GLOBAL_SEARCH_ROLE = stripRole(AuthorisedRoles.ROLE_GLOBAL_SEARCH)

// HmppsUser.userRoles has the ROLE_ prefixed stripped
function stripRole(role: string): string {
  return role.substring(role.indexOf('_') + 1)
}

function permissionsFromRoles(user?: HmppsUser, prisonerDetails?: PrisonerDetails): Permission[] {
  const permissions: Permission[] = [Permission.PRISONER_SEARCH]
  if (user && prisonerDetails) {
    const { userRoles } = user
    const isInCurrentCaseLoad = user.activeCaseLoadId === prisonerDetails.prisonId
    const isInAnyCaseLoad = user.caseLoads?.find(caseload => caseload.caseLoadId === prisonerDetails!.prisonId)
    if (isInCurrentCaseLoad || isInAnyCaseLoad || userRoles.includes(GLOBAL_SEARCH_ROLE)) {
      permissions.push(Permission.VIEW_CONTACT_LIST)
    } else {
      // TODO audit tried to view something not in caseload. Will probably need to make this a service rather than standalone functions.
    }
    if (isInCurrentCaseLoad) {
      if (userRoles.includes(ADMIN_USER_ROLE) || userRoles.includes(AUTHORISER_USER_ROLE)) {
        permissions.push(Permission.MANAGE_CONTACTS)
      }
      if (userRoles.includes(AUTHORISER_USER_ROLE)) {
        permissions.push(Permission.MANAGE_RESTRICTIONS, Permission.APPROVE_TO_VISIT)
      }
    }
  }
  return permissions
}

function hasPermission(user: HmppsUser, permission: Permission, prisonerDetails?: PrisonerDetails): boolean {
  if (!user) return false
  return permissionsFromRoles(user, prisonerDetails).includes(permission)
}

export { permissionsFromRoles, hasPermission }
