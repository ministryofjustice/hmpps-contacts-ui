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

const CreateContactRoutes = (auditService: AuditService) => {
  const router = Router({ mergeParams: true })

  const startController = new StartCreateContactJourneyController()
  router.get('/start', logPageViewMiddleware(auditService, startController), startController.GET)

  const enterNameController = new EnterNameController()
  router.get(
    '/enter-name/:journeyId',
    ensureInCreateContactJourney(),
    logPageViewMiddleware(auditService, enterNameController),
    enterNameController.GET,
  )
  router.post(
    '/enter-name/:journeyId',
    ensureInCreateContactJourney(),
    validate(createContactEnterNameSchemaFactory()),
    enterNameController.POST,
  )

  const enterDobController = new CreateContactEnterDobController()
  router.get(
    '/enter-dob/:journeyId',
    ensureInCreateContactJourney(),
    logPageViewMiddleware(auditService, enterDobController),
    enterDobController.GET,
  )
  router.post(
    '/enter-dob/:journeyId',
    ensureInCreateContactJourney(),
    validate(createContactEnterDobSchema()),
    enterDobController.POST,
  )

  const successController = new SuccessController()
  router.get('/success', logPageViewMiddleware(auditService, successController), successController.GET)

  return router
}

export default CreateContactRoutes
