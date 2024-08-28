import { Router } from 'express'
import SuccessController from './controller'
import AuditService from '../../../../services/auditService'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'

const SuccessRoutes = (auditService: AuditService) => {
  const router = Router({ mergeParams: true })
  const controller = new SuccessController()

  router.get('/', logPageViewMiddleware(auditService, controller), controller.GET)

  return router
}

export default SuccessRoutes
