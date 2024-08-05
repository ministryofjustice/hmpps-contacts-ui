import { type RequestHandler, Router } from 'express'
import ContactsController from './controller'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import AuditService from '../../services/auditService'

const ContactsRoutes = (auditService: AuditService): Router => {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const controller = new ContactsController(auditService)

  get('/', controller.GET)

  return router
}

export default ContactsRoutes
