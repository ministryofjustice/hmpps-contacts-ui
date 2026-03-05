import { RequestHandler, Router } from 'express'
import { PageHandler } from '../interfaces/pageHandler'
import logPageViewMiddleware from '../middleware/logPageViewMiddleware'
import { AuditService } from '../services'
import { PrisonerJourneyParams } from '../@types/journeys'
import { SchemaFactory, validate } from '../middleware/validationMiddleware'
import checkPermissionsWithoutPrisonerMiddleware from '../middleware/checkPermissionsWithoutPrisonerMiddleware'
import { contactSearchSchema } from '../routes/contacts/add/contact-search/contactSearchSchema'
import saveBackLinkMiddleware from '../middleware/saveBackLinkMiddleware'

export const routerWithoutPrisonerMethods = (router: Router, auditService: AuditService) => {
  const get = <P extends { [key: string]: string }>(
    path: string,
    controller: PageHandler,
    ...handlers: (RequestHandler | RequestHandler<P>)[]
  ) =>
    router.get(
      path,
      ...handlers,
      checkPermissionsWithoutPrisonerMiddleware(controller.REQUIRED_PERMISSION),
      logPageViewMiddleware(auditService, controller),
      saveBackLinkMiddleware(),
      controller.GET,
    )
  const post = <P extends { [key: string]: string }>(
    path: string,
    controller: PageHandler,
    ...handlers: (RequestHandler<P> | RequestHandler<PrisonerJourneyParams> | SchemaFactory<P>)[]
  ) =>
    router.post(
      path,
      ...(handlers as RequestHandler[]),
      checkPermissionsWithoutPrisonerMiddleware(controller.REQUIRED_PERMISSION),
      validate(contactSearchSchema),
      controller.POST ?? [],
    )
  return { get, post }
}
