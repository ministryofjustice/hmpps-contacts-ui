import { Router } from 'express'
import AuditService from '../../services/auditService'
import { ContactsService, PrisonerSearchService } from '../../services'
import CreateContactRoutes from './create/createContactRoutes'
import ManageContactsRoutes from './manage/manageContactsRoutes'

const ContactsRoutes = (
  auditService: AuditService,
  contactsService: ContactsService,
  prisonerSearchService: PrisonerSearchService,
): Router => {
  const router = Router({ mergeParams: true })
  router.use('/create', CreateContactRoutes(auditService, contactsService))
  router.use('/manage', ManageContactsRoutes(auditService, prisonerSearchService))
  return router
}

export default ContactsRoutes
