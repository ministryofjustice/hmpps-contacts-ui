import { Router } from 'express'
import ContactsController from './view/controller'
import CreateContactEnterNameController from './create/createContactEnterNameController'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import AuditService from '../../services/auditService'
import logPageViewMiddleware from '../../middleware/logPageViewMiddleware'
import { PageHandler } from '../../interfaces/pageHandler'

const ContactsRoutes = (auditService: AuditService): Router => {
  const router = Router({ mergeParams: true })

  const getViewContact = (path: string, handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))

  const getCreateContact = (path: string, handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))

  getViewContact('/', new ContactsController())
  getCreateContact('/create', new CreateContactEnterNameController())

  return router
}

export default ContactsRoutes
