import { Router } from 'express'
import { validate } from '../../../middleware/validationMiddleware'
import AuditService from '../../../services/auditService'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import ensureInManageContactsJourney from './manageContactsMiddleware'
import StartManageContactsJourneyController from './start/startManageContactsJourneyController'
import PrisonerSearchController from './prisoner-search/prisonerSearchController'
import PrisonerSearchResultsController from './prisoner-search/prisonerSearchResultsController'
import { prisonerSearchSchemaFactory } from './prisoner-search/prisonerSearchSchema'
import ListContactsController from './list/listContactsController'
import { PrisonerSearchService } from '../../../services'

const ManageContactsRoutes = (auditService: AuditService, prisonerSearchService: PrisonerSearchService) => {
  const router = Router({ mergeParams: true })

  // Part 1: Start manage contacts
  const startController = new StartManageContactsJourneyController()
  router.get('/start', logPageViewMiddleware(auditService, startController), startController.GET)

  // Part 2: Prisoner search
  const prisonerSearchController = new PrisonerSearchController()
  router.get(
    '/prisoner-search/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, prisonerSearchController),
    prisonerSearchController.GET,
  )
  router.post(
    '/prisoner-search/:journeyId',
    ensureInManageContactsJourney(),
    validate(prisonerSearchSchemaFactory()),
    prisonerSearchController.POST,
  )

  // Part 3: Prisoner search results
  const prisonerSearchResultsController = new PrisonerSearchResultsController(prisonerSearchService)
  router.get(
    '/prisoner-search-results/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, prisonerSearchResultsController),
    prisonerSearchResultsController.GET,
  )

  // Part 4: List contacts for a prisoner
  const listContactsController = new ListContactsController()
  router.get(
    '/prisoner/contact-list/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, listContactsController),
    listContactsController.GET,
  )

  // Part 5: View one contact
  // /prisoner/contact/:journeyId

  // Part 6: Manage the attribute of one contact (phones, addresses, IDs, emails, restrictions)
  // /prisoner/contact/phone/:journeyId
  // /prisoner/contact/email/:journeyId
  // /prisoner/contact/address/:journeyId
  // /prisoner/contact/restriction/:journeyId

  return router
}

export default ManageContactsRoutes
