import { RequestHandler, Router } from 'express'
import { PageHandler } from '../interfaces/pageHandler'
import logPageViewMiddleware from '../middleware/logPageViewMiddleware'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { AuditService } from '../services'
import { PrisonerJourneyParams } from '../@types/journeys'
import checkPermissionsMiddleware from '../middleware/checkPermissionsMiddleware'

export const routerMethods = (router: Router, auditService: AuditService) => {
  const get = <P extends { [key: string]: string }>(
    path: string,
    controller: PageHandler,
    ...handlers: (RequestHandler | RequestHandler<P>)[]
  ) =>
    router.get(
      path,
      ...handlers,
      checkPermissionsMiddleware(controller.REQUIRED_PERMISSION),
      logPageViewMiddleware(auditService, controller),
      asyncMiddleware(controller.GET),
    )
  const post = <P extends { [key: string]: string }>(
    path: string,
    controller: PageHandler,
    ...handlers: (RequestHandler<P> | RequestHandler<PrisonerJourneyParams>)[]
  ) =>
    router.post(
      path,
      ...(handlers as RequestHandler[]),
      checkPermissionsMiddleware(controller.REQUIRED_PERMISSION),
      asyncMiddleware(controller.POST!),
    )
  return { get, post }
}
