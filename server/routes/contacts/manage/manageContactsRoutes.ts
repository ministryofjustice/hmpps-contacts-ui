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
import ContactSearchController from './contact-search/contactSearchController'
import { createContactEnterNameSchemaFactory } from '../create/enter-name/createContactEnterNameSchemas'
import { contactSearchSchema } from './contact-search/contactSearchSchema'
import { createContactEnterDobSchema } from '../create/enter-dob/createContactEnterDobSchemas'

const ManageContactsRoutes = (
  auditService: AuditService,
  prisonerSearchService: PrisonerSearchService,
  contactsService: ContactsService,
) => {
  const router = Router({ mergeParams: true })

  // Part 1: Start manage contacts
  const startController = new StartManageContactsJourneyController()
  router.get('/start', logPageViewMiddleware(auditService, startController), asyncMiddleware(startController.GET))

  // Part 2: Prisoner search
  const prisonerSearchController = new PrisonerSearchController()
  router.get(
    '/prisoner-search/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, prisonerSearchController),
    asyncMiddleware(prisonerSearchController.GET),
  )
  router.post(
    '/prisoner-search/:journeyId',
    ensureInManageContactsJourney(),
    validate(prisonerSearchSchemaFactory()),
    asyncMiddleware(prisonerSearchController.POST),
  )

  // Part 3: Prisoner search results
  const prisonerSearchResultsController = new PrisonerSearchResultsController(prisonerSearchService)
  router.get(
    '/prisoner-search-results/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, prisonerSearchResultsController),
    asyncMiddleware(prisonerSearchResultsController.GET),
  )

  // Part 4: List contacts for a prisoner
  const listContactsController = new ListContactsController(prisonerSearchService, contactsService)
  router.get(
    '/list/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, listContactsController),
    asyncMiddleware(listContactsController.GET),
  )

  // Part 5: View one contact
  // /prisoner/contact/:journeyId

  // Part 6: Manage the attribute of one contact (phones, addresses, IDs, emails, restrictions)
  // /prisoner/contact/phone/:journeyId
  // /prisoner/contact/email/:journeyId
  // /prisoner/contact/address/:journeyId
  // /prisoner/contact/restriction/:journeyId

  // Part 7: Contact search
  const contactsSearchController = new ContactSearchController()
  router.get(
    '/add-prisoner-contact/:journeyId',
    ensureInManageContactsJourney(),
    logPageViewMiddleware(auditService, contactsSearchController),
    asyncMiddleware(contactsSearchController.GET),
  )

  router.post(
    '/add-prisoner-contact/:journeyId',
    ensureInManageContactsJourney(),
    validate(contactSearchSchema()),
    asyncMiddleware(contactsSearchController.POST),
  )

  return router
}

export default ManageContactsRoutes
