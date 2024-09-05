import { Router } from 'express'
import HomeController from './controller'
import logPageViewMiddleware from '../../middleware/logPageViewMiddleware'
import AuditService from '../../services/auditService'
import asyncMiddleware from '../../middleware/asyncMiddleware'

const HomeRoutes = (auditService: AuditService): Router => {
  const router = Router({ mergeParams: true })
  const controller = new HomeController()

  router.get('/', logPageViewMiddleware(auditService, controller), asyncMiddleware(controller.GET))
  return router
}

export default HomeRoutes
