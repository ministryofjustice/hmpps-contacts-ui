import type { RequestHandler, NextFunction } from 'express'
import { PrisonerBasePermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import asyncMiddleware from './asyncMiddleware'
import prisonPermissionsService from '../services/permissionService'

export default function checkPermissionsMiddleware(requiredPermission: PrisonerBasePermission): RequestHandler {
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
