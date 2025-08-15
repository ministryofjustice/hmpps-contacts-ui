import type { RequestHandler, NextFunction } from 'express'
import { prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import asyncMiddleware from './asyncMiddleware'
import prisonPermissionsService from '../services/permissionService'
import Permission from '../enumeration/permission'

export default function checkPermissionsMiddleware(requiredPermission: Permission): RequestHandler {
  return asyncMiddleware(async (req, res, next) => {
    const guard = prisonerPermissionsGuard(prisonPermissionsService, {
      requestDependentOn: [requiredPermission],
    })
    const handleNext: NextFunction = err => {
      if (err) return res.status(403).render('pages/errors/notFound')
      return next()
    }
    await guard(req, res, handleNext)
  })
}
