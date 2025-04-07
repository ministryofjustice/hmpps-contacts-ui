import { RequestHandler, Router } from 'express'
import { z } from 'zod'
import { SchemaFactory, validate } from '../../../middleware/validationMiddleware'
import AuditService from '../../../services/auditService'
import { ensureInManageContactsJourney } from './manageContactsMiddleware'
import StartPrisonerSearchJourneyController from './start/startPrisonerSearchJourneyController'
import PrisonerSearchController from './prisoner-search/prisonerSearchController'
import { prisonerSearchSchema } from './prisoner-search/prisonerSearchSchema'
import { PrisonerSearchService } from '../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import { routerMethods } from '../../../utils/routerMethods'
import PrisonerSearchResultsController from './prisoner-search/prisonerSearchResultsController'

// these routes are only being maintained until a proper entry point from the DPS profile is created
const PrisonerSearchRoutes = (auditService: AuditService, prisonerSearchService: PrisonerSearchService) => {
  const router = Router({ mergeParams: true })
  const { get, post } = routerMethods(router, auditService)

  const journeyRoute = <P extends { [key: string]: string }>({
    path,
    controller,
    journeyEnsurer,
    schema,
  }: {
    path: string
    controller: PageHandler
    journeyEnsurer: RequestHandler<P>
    schema: z.ZodTypeAny | SchemaFactory<P>
  }) => {
    get(path, controller, journeyEnsurer)
    post(path, controller, journeyEnsurer, validate(schema))
  }

  get('/prisoner-search', new StartPrisonerSearchJourneyController())

  journeyRoute({
    path: '/contacts/manage/prisoner-search/:journeyId',
    controller: new PrisonerSearchController(),
    journeyEnsurer: ensureInManageContactsJourney,
    schema: prisonerSearchSchema,
  })

  journeyRoute({
    path: '/contacts/manage/prisoner-search-results/:journeyId',
    controller: new PrisonerSearchResultsController(prisonerSearchService),
    journeyEnsurer: ensureInManageContactsJourney,
    schema: prisonerSearchSchema,
  })

  return router
}

export default PrisonerSearchRoutes
