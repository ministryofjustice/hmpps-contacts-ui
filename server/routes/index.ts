import { Router } from 'express'
import type { Services } from '../services'
import HomeRoutes from './home/routes'
import PrisonerImageRoutes from './prisonerImage/prisonerImageRoutes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import AddContactRoutes from './contacts/add/addContactRoutes'
import ManageContactsRoutes from './contacts/manage/manageContactsRoutes'
import RestrictionsRoutes from './restrictions/restrictionsRoutes'

export default function routes({
  auditService,
  prisonerSearchService,
  contactsService,
  prisonerImageService,
  referenceDataService,
  restrictionsService,
  prisonerAddressService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  router.use(
    '',
    AddContactRoutes(auditService, contactsService, referenceDataService, prisonerSearchService, restrictionsService),
  )
  router.use(
    '/',
    ManageContactsRoutes(
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
      restrictionsService,
      prisonerAddressService,
    ),
  )
  router.use(
    '/',
    RestrictionsRoutes(auditService, contactsService, referenceDataService, prisonerSearchService, restrictionsService),
  )
  router.use('/', HomeRoutes(auditService))

  // Special route - which gives the mini-profile nunjucks macro access to prisoner images
  router.get('/prisoner-image/:prisonerNumber', asyncMiddleware(new PrisonerImageRoutes(prisonerImageService).GET))

  return router
}
