import { Router } from 'express'
import AuditService from '../../../services/auditService'
import SuccessController from './success/createContactSuccessController'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import EnterNameController from './enter-name/createContactEnterNameController'
import { validate } from '../../../middleware/validationMiddleware'
import { createContactEnterNameSchemaFactory } from './enter-name/createContactEnterNameSchemas'
import CreateContactEnterDobController from './enter-dob/createContactEnterDobController'
import { createContactEnterDobSchema } from './enter-dob/createContactEnterDobSchemas'
import StartCreateContactJourneyController from './start/startCreateContactJourneyController'
import ensureInCreateContactJourney from './createContactMiddleware'
import { ContactsService, PrisonerSearchService } from '../../../services'
import CreateContactCheckAnswersController from './check-answers/createContactCheckAnswersController'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import CreateContactEnterEstimatedDobController from './enter-estimated-dob/createContactEnterEstimatedDobController'
import { createContactEnterEstimatedDobSchema } from './enter-estimated-dob/createContactEnterEstimatedDobSchemas'
import ReferenceDataService from '../../../services/referenceDataService'
import SelectRelationshipController from '../common/relationship/selectRelationshipController'
import { selectRelationshipSchemaFactory } from '../common/relationship/selectRelationshipSchemas'
import prisonerDetailsMiddleware from '../../../middleware/prisonerDetailsMiddleware'
import EmergencyContactController from '../common/emergency-contact/emergencyContactController'
import { selectEmergencyContactSchema } from '../common/emergency-contact/emergencyContactSchemas'

const CreateContactRoutes = (
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
    ensureInCreateContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, enterNameController),
    asyncMiddleware(enterNameController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-name/:journeyId',
    ensureInCreateContactJourney(),
    validate(createContactEnterNameSchemaFactory()),
    asyncMiddleware(enterNameController.POST),
  )

  const selectRelationshipController = new SelectRelationshipController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/select-relationship/:journeyId',
    ensureInCreateContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, selectRelationshipController),
    asyncMiddleware(selectRelationshipController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/select-relationship/:journeyId',
    ensureInCreateContactJourney(),
    validate(selectRelationshipSchemaFactory()),
    asyncMiddleware(selectRelationshipController.POST),
  )

  const selectEmergencyContact = new EmergencyContactController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/select-emergency-contact/:journeyId',
    ensureInCreateContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, selectEmergencyContact),
    asyncMiddleware(selectEmergencyContact.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/select-emergency-contact/:journeyId',
    ensureInCreateContactJourney(),
    validate(selectEmergencyContactSchema()),
    asyncMiddleware(selectEmergencyContact.POST),
  )

  const enterDobController = new CreateContactEnterDobController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/enter-dob/:journeyId',
    ensureInCreateContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, enterDobController),
    asyncMiddleware(enterDobController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-dob/:journeyId',
    ensureInCreateContactJourney(),
    validate(createContactEnterDobSchema()),
    asyncMiddleware(enterDobController.POST),
  )

  const enterEstimatedDobController = new CreateContactEnterEstimatedDobController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/enter-estimated-dob/:journeyId',
    ensureInCreateContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, enterEstimatedDobController),
    asyncMiddleware(enterEstimatedDobController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/enter-estimated-dob/:journeyId',
    ensureInCreateContactJourney(),
    validate(createContactEnterEstimatedDobSchema()),
    asyncMiddleware(enterEstimatedDobController.POST),
  )

  const checkAnswersController = new CreateContactCheckAnswersController(contactsService, referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId',
    ensureInCreateContactJourney(),
    prisonerDetailsMiddleware(prisonerSearchService),
    logPageViewMiddleware(auditService, checkAnswersController),
    asyncMiddleware(checkAnswersController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId',
    ensureInCreateContactJourney(),
    asyncMiddleware(checkAnswersController.POST),
  )

  const successController = new SuccessController()
  router.get(
    '/prisoner/:prisonerNumber/contacts/create/success',
    logPageViewMiddleware(auditService, successController),
    asyncMiddleware(successController.GET),
  )

  return router
}

export default CreateContactRoutes
