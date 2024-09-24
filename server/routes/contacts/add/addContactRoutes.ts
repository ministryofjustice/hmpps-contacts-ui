import { Router } from 'express'
import AuditService from '../../../services/auditService'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import EnterNameController from './enter-name/createContactEnterNameController'
import { validate } from '../../../middleware/validationMiddleware'
import { createContactEnterNameSchemaFactory } from './enter-name/createContactEnterNameSchemas'
import CreateContactEnterDobController from './enter-dob/createContactEnterDobController'
import { createContactEnterDobSchema } from './enter-dob/createContactEnterDobSchemas'
import StartCreateContactJourneyController from './start/startCreateContactJourneyController'
import ensureInAddContactJourney from './addContactMiddleware'
import { ContactsService, PrisonerSearchService } from '../../../services'
import CreateContactCheckAnswersController from './check-answers/createContactCheckAnswersController'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import CreateContactEnterEstimatedDobController from './enter-estimated-dob/createContactEnterEstimatedDobController'
import { createContactEnterEstimatedDobSchema } from './enter-estimated-dob/createContactEnterEstimatedDobSchemas'
import ReferenceDataService from '../../../services/referenceDataService'
import SelectRelationshipController from './relationship/selectRelationshipController'
import { selectRelationshipSchemaFactory } from './relationship/selectRelationshipSchemas'
import prisonerDetailsMiddleware from '../../../middleware/prisonerDetailsMiddleware'
import EmergencyContactController from './emergency-contact/emergencyContactController'
import { selectEmergencyContactSchema } from './emergency-contact/emergencyContactSchemas'
import { selectNextOfKinSchema } from './next-of-kin/nextOfKinSchemas'
import NextOfKinController from './next-of-kin/nextOfKinController'
import EnterRelationshipCommentsController from './relationship-comments/enterRelationshipCommentsController'
import { enterRelationshipCommentsSchema } from './relationship-comments/enterRelationshipCommentsSchemas'

const AddContactRoutes = (
  auditService: AuditService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
  prisonerSearchService: PrisonerSearchService,
) => {
  const router = Router({ mergeParams: true })

  const startController = new StartCreateContactJourneyController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/start',
    logPageViewMiddleware(auditService, startController),
    asyncMiddleware(startController.GET),
  )

  const enterNameController = new EnterNameController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/enter-name/:journeyId',
    ensureInAddContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, enterNameController),
    asyncMiddleware(enterNameController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-name/:journeyId',
    ensureInAddContactJourney(),
    validate(createContactEnterNameSchemaFactory()),
    asyncMiddleware(enterNameController.POST),
  )

  const selectRelationshipController = new SelectRelationshipController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/select-relationship/:journeyId',
    ensureInAddContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, selectRelationshipController),
    asyncMiddleware(selectRelationshipController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/select-relationship/:journeyId',
    ensureInAddContactJourney(),
    validate(selectRelationshipSchemaFactory()),
    asyncMiddleware(selectRelationshipController.POST),
  )

  const selectEmergencyContact = new EmergencyContactController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/select-emergency-contact/:journeyId',
    ensureInAddContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, selectEmergencyContact),
    asyncMiddleware(selectEmergencyContact.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/select-emergency-contact/:journeyId',
    ensureInAddContactJourney(),
    validate(selectEmergencyContactSchema()),
    asyncMiddleware(selectEmergencyContact.POST),
  )

  const selectNextOfKinController = new NextOfKinController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/select-next-of-kin/:journeyId',
    ensureInAddContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, selectNextOfKinController),
    asyncMiddleware(selectNextOfKinController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/select-next-of-kin/:journeyId',
    ensureInAddContactJourney(),
    validate(selectNextOfKinSchema()),
    asyncMiddleware(selectNextOfKinController.POST),
  )

  const enterDobController = new CreateContactEnterDobController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/enter-dob/:journeyId',
    ensureInAddContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, enterDobController),
    asyncMiddleware(enterDobController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-dob/:journeyId',
    ensureInAddContactJourney(),
    validate(createContactEnterDobSchema()),
    asyncMiddleware(enterDobController.POST),
  )

  const enterEstimatedDobController = new CreateContactEnterEstimatedDobController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/enter-estimated-dob/:journeyId',
    ensureInAddContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, enterEstimatedDobController),
    asyncMiddleware(enterEstimatedDobController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-estimated-dob/:journeyId',
    ensureInAddContactJourney(),
    validate(createContactEnterEstimatedDobSchema()),
    asyncMiddleware(enterEstimatedDobController.POST),
  )

  const enterRelationshipCommentsController = new EnterRelationshipCommentsController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/enter-relationship-comments/:journeyId',
    ensureInAddContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, enterRelationshipCommentsController),
    asyncMiddleware(enterRelationshipCommentsController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-relationship-comments/:journeyId',
    ensureInAddContactJourney(),
    validate(enterRelationshipCommentsSchema()),
    asyncMiddleware(enterRelationshipCommentsController.POST),
  )

  const checkAnswersController = new CreateContactCheckAnswersController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId',
    ensureInAddContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, checkAnswersController),
    asyncMiddleware(checkAnswersController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId',
    ensureInAddContactJourney(),
    asyncMiddleware(checkAnswersController.POST),
  )

  return router
}

export default AddContactRoutes
