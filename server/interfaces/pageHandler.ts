import { NextFunction, Request, Response } from 'express'
import { Page } from '../services/auditService'
import Permission from '../enumeration/permission'

export interface PageHandler {
  PAGE_NAME: Page
  REQUIRED_PERMISSION: Permission
  GET(req: Request, res: Response, next?: NextFunction): Promise<void>
  POST?(req: Request, res: Response, next?: NextFunction): Promise<void>
}
