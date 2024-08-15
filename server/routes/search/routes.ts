import { type RequestHandler, Router } from 'express'
import SearchController from './controller'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import AuditService from '../../services/auditService'
import { schema } from './schema'
import { validate } from '../../middleware/validationMiddleware'

const SearchRoutes = (auditService: AuditService): Router => {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, validate(schema), asyncMiddleware(handler))

  const controller = new SearchController(auditService)

  get('/', controller.GET)
  post('/', controller.POST)

  return router
}

export default SearchRoutes
