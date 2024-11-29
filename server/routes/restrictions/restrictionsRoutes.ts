import { Router } from 'express'
import AuditService from '../../services/auditService'
import logPageViewMiddleware from '../../middleware/logPageViewMiddleware'
import ContactsService from '../../services/contactsService'
import PrisonerSearchService from '../../services/prisonerSearchService'
import ReferenceDataService from '../../services/referenceDataService'
import StartAddRestrictionJourneyController from './start-add/startAddRestrictionJourneyController'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import populatePrisonerDetailsIfInCaseload from '../../middleware/populatePrisonerDetailsIfInCaseload'
import { validate } from '../../middleware/validationMiddleware'
import EnterRestrictionController from './enter-restriction/enterRestrictionController'
import ensureInAddRestrictionJourney from './addRestrictionMiddleware'
import { restrictionSchema } from './schema/restrictionSchema'
import AddRestrictionCheckAnswersController from './check-answers/addRestrictionCheckAnswersController'
import RestrictionsService from '../../services/restrictionsService'
import SuccessfullyAddedRestrictionController from './success/successfullyAddedRestrictionController'

const RestrictionsRoutes = (
  auditService: AuditService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
  prisonerSearchService: PrisonerSearchService,
  restrictionsService: RestrictionsService,
) => {
  const router = Router({ mergeParams: true })

  const startController = new StartAddRestrictionJourneyController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/start',
    logPageViewMiddleware(auditService, startController),
    asyncMiddleware(startController.GET),
  )

  const enterRestrictionController = new EnterRestrictionController(referenceDataService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/enter-restriction/:journeyId',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    ensureInAddRestrictionJourney(),
    logPageViewMiddleware(auditService, enterRestrictionController),
    asyncMiddleware(enterRestrictionController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/enter-restriction/:journeyId',
    ensureInAddRestrictionJourney(),
    validate(restrictionSchema()),
    asyncMiddleware(enterRestrictionController.POST),
  )

  const checkAnswersController = new AddRestrictionCheckAnswersController(referenceDataService, restrictionsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/check-answers/:journeyId',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    ensureInAddRestrictionJourney(),
    logPageViewMiddleware(auditService, checkAnswersController),
    asyncMiddleware(checkAnswersController.GET),
  )
  router.post(
    '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/check-answers/:journeyId',
    ensureInAddRestrictionJourney(),
    asyncMiddleware(checkAnswersController.POST),
  )

  const successController = new SuccessfullyAddedRestrictionController(contactsService)
  router.get(
    '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/success',
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    logPageViewMiddleware(auditService, successController),
    asyncMiddleware(successController.GET),
  )
  return router
}

export default RestrictionsRoutes
