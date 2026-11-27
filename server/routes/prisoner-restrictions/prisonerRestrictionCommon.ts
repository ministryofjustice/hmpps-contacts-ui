import { NextFunction, Request, Response } from 'express'
import { format } from 'date-fns'
import config from '../../config'
import AuthorisedRoles from '../../enumeration/authorisedRoles'
import { formatNameFirstNameFirst } from '../../utils/formatName'

export type PrisonerParams = { prisonerNumber: string }
export type RestrictionParams = PrisonerParams & { prisonerRestrictionId: string }

export const MAX_COMMENT_LENGTH = 240
export const formatDateForDatePicker = (date?: string) => (date ? format(new Date(date), 'dd/MM/yyyy') : undefined)
export const prisonerName = (res: Response) =>
  formatNameFirstNameFirst(res.locals.prisonerDetails!, { excludeMiddleNames: true })

// HmppsUser.userRoles has the ROLE_ prefix stripped
const MAINTAIN_RESTRICTIONS_ROLES = [
  AuthorisedRoles.ROLE_CONTACTS_ADMINISTRATOR,
  AuthorisedRoles.ROLE_CONTACTS_AUTHORISER,
].map(role => role.replace(/^ROLE_/, ''))

export const isPrisonerRestrictionsMaintenanceEnabled = (caseLoadId?: string) =>
  !!caseLoadId && config.feature.prisonerRestrictionsMaintenanceEnabledPrisons.includes(caseLoadId)

export const hasMaintainRestrictionsRole = (userRoles: string[] = []) =>
  MAINTAIN_RESTRICTIONS_ROLES.some(role => userRoles.includes(role))

// Only Contacts Administrators and Contacts Authorisers can view or maintain prisoner restrictions in DPS
export const requireMaintainRestrictionsRole = (req: Request, res: Response, next: NextFunction) => {
  if (!hasMaintainRestrictionsRole(res.locals.user?.userRoles)) {
    return res.status(403).render('pages/errors/notFound')
  }
  return next()
}

// Where the feature is enabled, viewing the restrictions page needs the same roles as maintaining them
export const restrictionsPageRoleCheck = (req: Request, res: Response, next: NextFunction) =>
  isPrisonerRestrictionsMaintenanceEnabled(req.session?.activeCaseLoadId)
    ? requireMaintainRestrictionsRole(req, res, next)
    : next()

export const requirePrisonerRestrictionsMaintenanceEnabled = (req: Request, res: Response, next: NextFunction) => {
  if (!isPrisonerRestrictionsMaintenanceEnabled(req.session?.activeCaseLoadId)) {
    return res.status(404).render('pages/errors/notFound')
  }
  return next()
}
