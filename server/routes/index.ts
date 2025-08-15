import { Router } from 'express'
import type { Services } from '../services'
import PrisonerImageRoutes from './prisonerImage/prisonerImageRoutes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import AddContactRoutes from './contacts/add/addContactRoutes'
import ManageContactsRoutes from './contacts/manage/manageContactsRoutes'
import RestrictionsRoutes from './restrictions/restrictionsRoutes'
import PrisonerSearchRoutes from './contacts/manage/prisonerSearchRoutes'

export default function routes({
  auditService,
  prisonerSearchService,
  contactsService,
  prisonerImageService,
  referenceDataService,
  restrictionsService,
  prisonerAddressService,
  organisationsService,
  telemetryService,
  permissionsService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  router.use(
    '',
    AddContactRoutes(
      auditService,
      contactsService,
      referenceDataService,
      prisonerSearchService,
      restrictionsService,
      prisonerAddressService,
      organisationsService,
      telemetryService,
      permissionsService,
    ),
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
      organisationsService,
      permissionsService,
    ),
  )
  router.use(
    '/',
    RestrictionsRoutes(
      auditService,
      contactsService,
      referenceDataService,
      prisonerSearchService,
      restrictionsService,
      permissionsService,
    ),
  )

  router.use('/', PrisonerSearchRoutes(auditService, prisonerSearchService, permissionsService))

  // Special route - which gives the mini-profile nunjucks macro access to prisoner images
  router.get('/prisoner-image/:prisonerNumber', asyncMiddleware(new PrisonerImageRoutes(prisonerImageService).GET))

  return router
}
