import { Router } from 'express'
import { validate } from '../../../middleware/validationMiddleware'
import AuditService from '../../../services/auditService'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import { ensureInManageContactsJourney, ensureInUpdateDateOfBirthJourney } from './manageContactsMiddleware'
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
import ManageContactStaffController from './staff/manageContactStaffController'
import { phoneNumberSchemaFactory } from './phone/phoneSchemas'
import ManageInterpreterController from './interpreter/manageInterpreterController'
import ManageContactEditPhoneController from './phone/edit/manageContactEditPhoneController'
import ManageDomesticStatusController from './domestic-status/manageDomesticStatusController'
import ManageContactDeletePhoneController from './phone/delete/manageContactDeletePhoneController'
import { identitySchemaFactory } from './identities/IdentitySchemas'
import ManageContactAddIdentityController from './identities/add/manageContactAddIdentityController'
import ManageContactEditIdentityController from './identities/edit/manageContactEditIdentityController'
import ManageContactDeleteIdentityController from './identities/delete/manageContactDeleteIdentityController'
import { enterDobSchema } from '../common/enter-dob/enterDobSchemas'
import StartUpdateDateOfBirthJourneyController from './update-dob/start/startUpdateDateOfBirthJourneyController'
import ManageContactEnterDobController from './update-dob/enter-dob/manageContactEnterDobController'
import UpdateDateOfBirthEnterEstimatedDobController from './update-dob/enter-estimated-dob/updateDateOfBirthEnterEstimatedDobController'
import CompleteUpdateDateOfBirthJourneyController from './update-dob/complete/completeUpdateDateOfBirthJourneyController'
import { enterEstimatedDobSchema } from '../common/enter-estimated-dob/enterEstimatedDobSchemas'

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

  const manageInterpreterController = new ManageInterpreterController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/interpreter',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageInterpreterController),
    asyncMiddleware(manageInterpreterController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/interpreter',
    asyncMiddleware(manageInterpreterController.POST),
  )

  const manageContactStaffController = new ManageContactStaffController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/staff',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageContactStaffController),
    asyncMiddleware(manageContactStaffController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/staff',
    asyncMiddleware(manageContactStaffController.POST),
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

  const manageContactAddIdentityController = new ManageContactAddIdentityController(
    contactsService,
    referenceDataService,
  )
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/create',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageContactAddIdentityController),
    asyncMiddleware(manageContactAddIdentityController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/create',
    validate(identitySchemaFactory()),
    asyncMiddleware(manageContactAddIdentityController.POST),
  )

  const manageContactEditIdentityController = new ManageContactEditIdentityController(
    contactsService,
    referenceDataService,
  )
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/edit',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageContactEditIdentityController),
    asyncMiddleware(manageContactEditIdentityController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/edit',
    validate(identitySchemaFactory()),
    asyncMiddleware(manageContactEditIdentityController.POST),
  )

  const manageContactDeleteIdentityController = new ManageContactDeleteIdentityController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/identity/:contactIdentityId/delete',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageContactDeleteIdentityController),
    asyncMiddleware(manageContactDeleteIdentityController.GET),
  )

  const manageDomesticStatusController = new ManageDomesticStatusController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/domestic-status',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageDomesticStatusController),
    asyncMiddleware(manageDomesticStatusController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/domestic-status',
    asyncMiddleware(manageDomesticStatusController.POST),
  )

  const manageContactDeletePhoneController = new ManageContactDeletePhoneController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/phone/:contactPhoneId/delete',
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageContactDeletePhoneController),
    asyncMiddleware(manageContactDeletePhoneController.GET),
  )

  const startUpdateDobJourneyController = new StartUpdateDateOfBirthJourneyController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/start',
    logPageViewMiddleware(auditService, startUpdateDobJourneyController),
    asyncMiddleware(startUpdateDobJourneyController.GET),
  )

  const manageContactUpdateDateOfBirthController = new ManageContactEnterDobController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/enter-dob/:journeyId',
    ensureInUpdateDateOfBirthJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, manageContactUpdateDateOfBirthController),
    asyncMiddleware(manageContactUpdateDateOfBirthController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/enter-dob/:journeyId',
    ensureInUpdateDateOfBirthJourney(),
    validate(enterDobSchema()),
    asyncMiddleware(manageContactUpdateDateOfBirthController.POST),
  )

  const updateDateOfBirthEnterEstimatedDobController = new UpdateDateOfBirthEnterEstimatedDobController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/enter-estimated-dob/:journeyId',
    ensureInUpdateDateOfBirthJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, updateDateOfBirthEnterEstimatedDobController),
    asyncMiddleware(updateDateOfBirthEnterEstimatedDobController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/enter-estimated-dob/:journeyId',
    ensureInUpdateDateOfBirthJourney(),
    validate(enterEstimatedDobSchema()),
    asyncMiddleware(updateDateOfBirthEnterEstimatedDobController.POST),
  )

  const completeUpdateDobJourneyController = new CompleteUpdateDateOfBirthJourneyController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/complete/:journeyId',
    ensureInUpdateDateOfBirthJourney(),
    logPageViewMiddleware(auditService, completeUpdateDobJourneyController),
    asyncMiddleware(completeUpdateDobJourneyController.GET),
  )

  return router
}

export default ManageContactsRoutes
