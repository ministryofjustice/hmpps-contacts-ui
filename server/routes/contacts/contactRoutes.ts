import { Router } from 'express'
import CreateContactRoutes from './create/createContactRoutes'
import AuditService from '../../services/auditService'
import { ContactsService } from '../../services'

const ContactsRoutes = (auditService: AuditService, contactsService: ContactsService): Router => {
  const router = Router({ mergeParams: true })
  router.use('/create', CreateContactRoutes(auditService, contactsService))
  return router
}

export default ContactsRoutes
