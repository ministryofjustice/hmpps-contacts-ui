import { RequestHandler, Router } from 'express'
import { z } from 'zod'
import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import AuditService from '../../services/auditService'
import ContactsService from '../../services/contactsService'
import PrisonerSearchService from '../../services/prisonerSearchService'
import ReferenceDataService from '../../services/referenceDataService'
import StartAddRestrictionJourneyController from './start-add/startAddRestrictionJourneyController'
import populatePrisonerDetailsIfInCaseload from '../../middleware/populatePrisonerDetailsIfInCaseload'
import { SchemaFactory, validate } from '../../middleware/validationMiddleware'
import EnterNewRestrictionController from './enter-restriction/enterNewRestrictionController'
import { restrictionSchema } from './schema/restrictionSchema'
import AddRestrictionCheckAnswersController from './check-answers/addRestrictionCheckAnswersController'
import RestrictionsService from '../../services/restrictionsService'
import SuccessfullyAddedRestrictionController from './success/successfullyAddedRestrictionController'
import UpdateRestrictionController from './update-restriction/updateRestrictionController'
import CancelAddRestrictionController from './cancel/cancelAddRestrictionController'
import { PageHandler } from '../../interfaces/pageHandler'
import { routerMethods } from '../../utils/routerMethods'
import ensureInAddRestrictionJourney from './addRestrictionMiddleware'

const RestrictionsRoutes = (
  auditService: AuditService,
  contactsService: ContactsService,
  referenceDataService: ReferenceDataService,
  prisonerSearchService: PrisonerSearchService,
  restrictionsService: RestrictionsService,
  permissionsService: PermissionsService,
) => {
  const router = Router({ mergeParams: true })
  const { get, post } = routerMethods(router, permissionsService, auditService)
  const journeyRoute = <P extends { [key: string]: string }>({
    path,
    controller,
    schema,
    noValidation,
  }: {
    path: string
    controller: PageHandler
    schema?: z.ZodTypeAny | SchemaFactory<P>
    noValidation?: boolean
  }) => {
    if (!schema && !noValidation) {
      throw Error('Missing validation schema for POST route')
    }
    const getMiddleware = [
      ensureInAddRestrictionJourney,
      populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
    ]
    get(path, controller, ...getMiddleware)
    if (schema && !noValidation) {
      post(path, controller, ensureInAddRestrictionJourney, validate(schema))
    } else {
      post(path, controller, ensureInAddRestrictionJourney)
    }
  }

  get(
    '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/start',
    new StartAddRestrictionJourneyController(contactsService),
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/enter-restriction/:journeyId',
    controller: new EnterNewRestrictionController(referenceDataService),
    schema: restrictionSchema(),
  })

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/check-answers/:journeyId',
    controller: new AddRestrictionCheckAnswersController(referenceDataService, restrictionsService),
    noValidation: true,
  })

  get(
    '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/success',
    new SuccessfullyAddedRestrictionController(contactsService),
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
  )

  journeyRoute({
    path: '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/cancel/:journeyId',
    controller: new CancelAddRestrictionController(),
    noValidation: true,
  })

  const updateRestrictionsPath =
    '/prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/update/:restrictionClass/enter-restriction/:restrictionId'
  const updateRestrictionsController = new UpdateRestrictionController(
    contactsService,
    restrictionsService,
    referenceDataService,
  )
  get(
    updateRestrictionsPath,
    updateRestrictionsController,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService),
  )
  post(
    updateRestrictionsPath,
    updateRestrictionsController,
    populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService) as RequestHandler,
    validate(restrictionSchema()),
  )

  return router
}

export default RestrictionsRoutes
