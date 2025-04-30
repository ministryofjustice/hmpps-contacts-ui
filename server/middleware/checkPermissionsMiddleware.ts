import type { RequestHandler } from 'express'
import asyncMiddleware from './asyncMiddleware'
import Permission from '../enumeration/permission'
import { permissionsFromRoles } from '../utils/permissionsUtils'

export default function checkPermissionsMiddleware(requiredPermission: Permission): RequestHandler {
  return asyncMiddleware((req, res, next) => {
    if (permissionsFromRoles(res.locals?.user?.userRoles ?? []).includes(requiredPermission)) {
      return next()
    }
    return res.status(403).render('pages/errors/notFound')
  })
}
