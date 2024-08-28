import { Router } from 'express'
import CreateContactRoutes from './create/routes'
import AuditService from '../../services/auditService'

const ContactsRoutes = (auditService: AuditService): Router => {
  const router = Router({ mergeParams: true })
  router.use('/create', CreateContactRoutes(auditService))
  return router
}

export default ContactsRoutes
