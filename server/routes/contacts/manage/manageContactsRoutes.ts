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
import ManageSpokenLanguageController from './spoken-language/manageSpokenLanguageController'
import ManageContactAddPhoneController from './phone/add/manageContactAddPhoneController'
import { phoneNumberSchemaFactory } from './phone/phoneSchemas'
import ManageContactEditPhoneController from './phone/edit/manageContactEditPhoneController'
import ManageContactDeletePhoneController from './phone/delete/manageContactDeletePhoneController'

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
    '/prisoner/:prisonerNumber/contacts/manage/:contactId',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, contactDetailsController),
    asyncMiddleware(contactDetailsController.GET),
  )

  // Part 6: Manage the attribute of one contact (phones, addresses, IDs, emails, restrictions)
  const spokenLanguageController = new ManageSpokenLanguageController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/language',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, spokenLanguageController),
    asyncMiddleware(spokenLanguageController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/language',
    asyncMiddleware(spokenLanguageController.POST),
  )

  const manageContactAddPhoneController = new ManageContactAddPhoneController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/create',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageContactAddPhoneController),
    asyncMiddleware(manageContactAddPhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/create',
    validate(phoneNumberSchemaFactory()),
    asyncMiddleware(manageContactAddPhoneController.POST),
  )

  const manageContactEditPhoneController = new ManageContactEditPhoneController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/edit',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageContactEditPhoneController),
    asyncMiddleware(manageContactEditPhoneController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/edit',
    validate(phoneNumberSchemaFactory()),
    asyncMiddleware(manageContactEditPhoneController.POST),
  )

  const manageContactDeletePhoneController = new ManageContactDeletePhoneController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/delete',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageContactDeletePhoneController),
    asyncMiddleware(manageContactDeletePhoneController.GET),
  )

  return router
}

export default ManageContactsRoutes
