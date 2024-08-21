import { Router } from 'express'
import ContactsController from './controller'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import AuditService from '../../services/auditService'
import logPageViewMiddleware from '../../middleware/logPageViewMiddleware'
import { PageHandler } from '../../interfaces/pageHandler'

const ContactsRoutes = (auditService: AuditService): Router => {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(controller.GET))

  const controller = new ContactsController()
  get('/', controller)

  return router
}

export default ContactsRoutes
