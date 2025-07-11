import type { RequestHandler } from 'express'
import asyncMiddleware from './asyncMiddleware'
import Permission from '../enumeration/permission'
import { hasPermission } from '../utils/permissionsUtils'

export default function checkPermissionsMiddleware(requiredPermission: Permission): RequestHandler {
  return asyncMiddleware((req, res, next) => {
    if (hasPermission(res.locals?.user, requiredPermission, res.locals.prisonerDetails)) {
      return next()
    }
    return res.status(403).render('pages/errors/notFound')
  })
}
