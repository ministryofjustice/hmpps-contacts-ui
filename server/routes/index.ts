import { Router } from 'express'
import { Services } from '../services'
import PrisonerImageRoutes from './prisonerImage/prisonerImageRoutes'
import asyncMiddleware from '../middleware/asyncMiddleware'
import AddContactRoutes from './contacts/add/addContactRoutes'
import ManageContactsRoutes from './contacts/manage/manageContactsRoutes'
import RestrictionsRoutes from './restrictions/restrictionsRoutes'
import SearchContactRoutes from './contacts/view/searchContactRoutes'

export default function routes({
  auditService,
  prisonerSearchService,
  contactsService,
  alertsService,
  prisonerImageService,
  referenceDataService,
  restrictionsService,
  prisonerAddressService,
  organisationsService,
  telemetryService,
  permissionsService,
  contactAuditHistoryService,
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
      alertsService,
    ),
  )
  router.use(
    '/',
    ManageContactsRoutes(
      auditService,
      prisonerSearchService,
      contactsService,
      alertsService,
      referenceDataService,
      restrictionsService,
      prisonerAddressService,
      organisationsService,
      permissionsService,
      contactAuditHistoryService,
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
      alertsService,
    ),
  )

  router.use(
    '/direct',
    SearchContactRoutes(
      auditService,
      contactsService,
      referenceDataService,
      prisonerSearchService,
      restrictionsService,
    ),
  )
  // Special route - which gives the mini-profile nunjucks macro access to prisoner images
  router.get('/prisoner-image/:prisonerNumber', asyncMiddleware(new PrisonerImageRoutes(prisonerImageService).GET))

  return router
}
