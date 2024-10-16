import { Router } from 'express'
import type { Services } from '../services'
import HomeRoutes from './home/routes'
import PrisonerImageRoutes from './prisonerImage/prisonerImageRoutes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import AddContactRoutes from './contacts/add/addContactRoutes'
import ManageContactsRoutes from './contacts/manage/manageContactsRoutes'

export default function routes({
  auditService,
  prisonerSearchService,
  contactsService,
  prisonerImageService,
  referenceDataService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  router.use('', AddContactRoutes(auditService, contactsService, referenceDataService, prisonerSearchService))
  router.use('/', ManageContactsRoutes(auditService, prisonerSearchService, contactsService, referenceDataService))
  router.use('/', HomeRoutes(auditService))

  // Special route - which gives the mini-profile nunjucks macro access to prisoner images
  router.get('/prisoner-image/:prisonerNumber', asyncMiddleware(new PrisonerImageRoutes(prisonerImageService).GET))

  return router
}
