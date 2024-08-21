import { Router } from 'express'
import { PageHandler } from '../../interfaces/pageHandler'
import SearchController from './controller'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import AuditService from '../../services/auditService'
import logPageViewMiddleware from '../../middleware/logPageViewMiddleware'
import { schema } from './schema'
import { validate } from '../../middleware/validationMiddleware'

const SearchRoutes = (auditService: AuditService): Router => {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(controller.GET))
  const post = (path: string) => router.post(path, validate(schema), asyncMiddleware(controller.POST))

  const controller = new SearchController()

  get('/', controller)
  post('/')

  return router
}

export default SearchRoutes
