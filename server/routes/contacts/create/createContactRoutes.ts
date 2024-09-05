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
import { ContactsService } from '../../../services'
import CreateContactCheckAnswersController from './check-answers/createContactCheckAnswersController'
import asyncMiddleware from '../../../middleware/asyncMiddleware'

const CreateContactRoutes = (auditService: AuditService, contactsService: ContactsService) => {
  const router = Router({ mergeParams: true })

  const startController = new StartCreateContactJourneyController()
  router.get('/start', logPageViewMiddleware(auditService, startController), asyncMiddleware(startController.GET))

  const enterNameController = new EnterNameController()
  router.get(
    '/enter-name/:journeyId',
    ensureInCreateContactJourney(),
    logPageViewMiddleware(auditService, enterNameController),
    asyncMiddleware(enterNameController.GET),
  )
  router.post(
    '/enter-name/:journeyId',
    ensureInCreateContactJourney(),
    validate(createContactEnterNameSchemaFactory()),
    asyncMiddleware(enterNameController.POST),
  )

  const enterDobController = new CreateContactEnterDobController()
  router.get(
    '/enter-dob/:journeyId',
    ensureInCreateContactJourney(),
    logPageViewMiddleware(auditService, enterDobController),
    asyncMiddleware(enterDobController.GET),
  )
  router.post(
    '/enter-dob/:journeyId',
    ensureInCreateContactJourney(),
    validate(createContactEnterDobSchema()),
    asyncMiddleware(enterDobController.POST),
  )

  const checkAnswersController = new CreateContactCheckAnswersController(contactsService)
  router.get(
    '/check-answers/:journeyId',
    ensureInCreateContactJourney(),
    logPageViewMiddleware(auditService, checkAnswersController),
    asyncMiddleware(checkAnswersController.GET),
  )
  router.post('/check-answers/:journeyId', ensureInCreateContactJourney(), asyncMiddleware(checkAnswersController.POST))

  const successController = new SuccessController()
  router.get('/success', logPageViewMiddleware(auditService, successController), asyncMiddleware(successController.GET))

  return router
}

export default CreateContactRoutes
