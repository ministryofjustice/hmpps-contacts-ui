import { Router } from 'express'
import AuditService from '../../services/auditService'

import CreateContactRoutes from './create/createContactRoutes'
import ManageContactsRoutes from './manage/manageContactsRoutes'
import { PrisonerSearchService } from '../../services'

const ContactsRoutes = (auditService: AuditService, prisonerSearchService: PrisonerSearchService): Router => {
  const router = Router({ mergeParams: true })
  router.use('/create', CreateContactRoutes(auditService))
  router.use('/manage', ManageContactsRoutes(auditService, prisonerSearchService))
  return router
}

export default ContactsRoutes
