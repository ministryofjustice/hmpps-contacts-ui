import { Router } from 'express'
import type { Services } from '../services'
import ContactsRoutes from './contacts/contactRoutes'
import HomeRoutes from './home/routes'
import PrisonerImageRoutes from './prisonerImage/prisonerImageRoutes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import CreateContactRoutes from './contacts/create/createContactRoutes'

export default function routes({
  auditService,
  prisonerSearchService,
  contactsService,
  prisonerImageService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  router.use('/prisoner/:prisonerNumber/contacts/create', CreateContactRoutes(auditService, contactsService))
  router.use('/contacts', ContactsRoutes(auditService, contactsService, prisonerSearchService))
  router.use('/', HomeRoutes(auditService))

  // Special route - which gives the mini-profile nunjucks macro access to prisoner images
  router.get('/prisoner-image/:prisonerNumber', asyncMiddleware(new PrisonerImageRoutes(prisonerImageService).GET))

  return router
}
