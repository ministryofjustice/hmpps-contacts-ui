import type { RequestHandler, NextFunction } from 'express'
import { PermissionsService, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import asyncMiddleware from './asyncMiddleware'
import Permission from '../enumeration/permission'

export default function checkPermissionsMiddleware(
  permissionsService: PermissionsService,
  requiredPermission: Permission,
): RequestHandler {
  return asyncMiddleware(async (req, res, next) => {
    const guard = prisonerPermissionsGuard(permissionsService, {
      requestDependentOn: [requiredPermission],
    })
    const handleNext: NextFunction = err => {
      if (err) return res.status(403).render('pages/errors/notFound')
      return next()
    }
    await guard(req, res, handleNext)
  })
}
