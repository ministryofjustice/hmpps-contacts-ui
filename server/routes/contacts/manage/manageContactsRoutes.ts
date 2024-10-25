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
import { ContactsService, PrisonerSearchService } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import prisonerDetailsMiddleware from '../../../middleware/prisonerDetailsMiddleware'
import ContactDetailsController from './contact-details/contactDetailsController'
import ReferenceDataService from '../../../services/referenceDataService'
import SpokenLanguageController from './spoken-language/spokenLanguageController'

const ManageContactsRoutes = (
  auditService: AuditService,
  prisonerSearchService: PrisonerSearchService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
) => {
  const router = Router({ mergeParams: true })

  // Part 1: Start manage contacts
  const startController = new StartManageContactsJourneyController()
  router.get(
    '/contacts/manage/start',
    logPageViewMiddleware(auditService, startController),
    asyncMiddleware(startController.GET),
  )

  // Part 2: Prisoner search
  const prisonerSearchController = new PrisonerSearchController()
  router.get(
    '/contacts/manage/prisoner-search/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, prisonerSearchController),
    asyncMiddleware(prisonerSearchController.GET),
  )
  router.post(
    '/contacts/manage/prisoner-search/:journeyId',
    ensureInManageContactsJourney(),
    validate(prisonerSearchSchemaFactory()),
    asyncMiddleware(prisonerSearchController.POST),
  )

  // Part 3: Prisoner search results
  const prisonerSearchResultsController = new PrisonerSearchResultsController(prisonerSearchService)
  router.get(
    '/contacts/manage/prisoner-search-results/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, prisonerSearchResultsController),
    asyncMiddleware(prisonerSearchResultsController.GET),
  )
  router.post(
    '/contacts/manage/prisoner-search-results/:journeyId',
    ensureInManageContactsJourney(),
    validate(prisonerSearchSchemaFactory()),
    asyncMiddleware(prisonerSearchResultsController.POST),
  )

  // Part 4: List contacts for a prisoner
  const listContactsController = new ListContactsController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/list/:journeyId',
    ensureInManageContactsJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, listContactsController),
    asyncMiddleware(listContactsController.GET),
  )
  // Direct entry to prisoner contact page
  router.get(
    '/prisoner/:prisonerNumber/contacts/list',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, listContactsController),
    asyncMiddleware(listContactsController.GET),
  )

  // Part 5: View one contact
  const contactDetailsController = new ContactDetailsController(contactsService, referenceDataService)
  router.get(
    '/contacts/manage/:prisonerNumber/:contactId',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, contactDetailsController),
    asyncMiddleware(contactDetailsController.GET),
  )

  // Part 6: Manage the attribute of one contact (phones, addresses, IDs, emails, restrictions)
  const spokenLanguageController = new SpokenLanguageController(contactsService)
  router.get(
    '/contacts/manage/:prisonerNumber/:contactId/language/:journeyId',
    ensureInManageContactsJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, spokenLanguageController),
    asyncMiddleware(spokenLanguageController.GET),
  )

  router.post(
    '/contacts/manage/:prisonerNumber/:contactId/language/:journeyId',
    ensureInManageContactsJourney(),
    asyncMiddleware(spokenLanguageController.POST),
  )

  return router
}

export default ManageContactsRoutes
