import { Router } from 'express'
import EnterNameController from './controller'
import { schemaFactory } from './schemas'
import { validate } from '../../../../middleware/validationMiddleware'
import AuditService from '../../../../services/auditService'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'

const EnterNameRoutes = (auditService: AuditService) => {
  const router = Router({ mergeParams: true })
  const controller = new EnterNameController()

  router.get('/', logPageViewMiddleware(auditService, controller), controller.GET)
  router.post('/', validate(schemaFactory(), '/contacts/create/enter-name'), controller.POST)

  return router
}

export default EnterNameRoutes
