import type { RequestHandler, NextFunction } from 'express'
import {
  isGranted,
  PermissionsService,
  PrisonerPermission,
  prisonerPermissionsGuard,
} from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import Permission from '../enumeration/permission'

export default function checkPermissionsMiddleware(
  permissionsService: PermissionsService,
  requiredPermission: Permission,
  acceptedPermissions?: PrisonerPermission[],
): RequestHandler {
  if (acceptedPermissions?.length) return checkAnyPermissionMiddleware(permissionsService, acceptedPermissions)
  return async (req, res, next) => {
    const guard = prisonerPermissionsGuard(permissionsService, {
      requestDependentOn: [requiredPermission],
    })
    const handleNext: NextFunction = err => {
      if (err) return res.status(403).render('pages/errors/notFound')
      return next()
    }
    await guard(req, res, handleNext)
  }
}

type PermissionsParams = Parameters<PermissionsService['getPrisonerPermissions']>[0]

// The library guard requires every listed permission, so for "any of" access the permissions are evaluated directly
function checkAnyPermissionMiddleware(
  permissionsService: PermissionsService,
  acceptedPermissions: PrisonerPermission[],
): RequestHandler {
  return async (req, res, next) => {
    const prisonerData =
      req.middleware?.prisonerData ??
      ((await permissionsService.getPrisonerDetails(String(req.params.prisonerNumber))) as unknown as Prisoner)
    const prisonerPermissions = permissionsService.getPrisonerPermissions({
      user: res.locals.user as unknown as PermissionsParams['user'],
      prisoner: prisonerData as unknown as PermissionsParams['prisoner'],
      requestDependentOn: acceptedPermissions,
    })
    if (!acceptedPermissions.some(permission => isGranted(permission, prisonerPermissions))) {
      return res.status(403).render('pages/errors/notFound')
    }
    req.middleware = { ...req.middleware, prisonerData }
    res.locals.prisonerPermissions = prisonerPermissions
    return next()
  }
}
