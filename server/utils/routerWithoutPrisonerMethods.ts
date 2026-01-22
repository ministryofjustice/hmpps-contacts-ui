import { RequestHandler, Router } from 'express'
import { PageHandler } from '../interfaces/pageHandler'
import logPageViewMiddleware from '../middleware/logPageViewMiddleware'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { AuditService } from '../services'
import { PrisonerJourneyParams } from '../@types/journeys'
import { SchemaFactory } from '../middleware/validationMiddleware'
import checkPermissionsWithoutPrisonerMiddleware from '../middleware/checkPermissionsWithoutPrisonerMiddleware'

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
      asyncMiddleware(controller.GET),
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
      asyncMiddleware(controller.POST!),
    )
  return { get, post }
}
