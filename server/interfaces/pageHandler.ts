import { NextFunction, Request, Response } from 'express'
import { PrisonerPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Page } from '../services/auditService'
import Permission from '../enumeration/permission'

export interface PageHandler {
  PAGE_NAME: Page
  REQUIRED_PERMISSION: Permission
  // when set, the user needs at least one of these (instead of all of REQUIRED_PERMISSION)
  ACCEPTED_PERMISSIONS?: PrisonerPermission[]
  GET(req: Request, res: Response, next?: NextFunction): Promise<void>
  POST?(req: Request, res: Response, next?: NextFunction): Promise<void>
}
