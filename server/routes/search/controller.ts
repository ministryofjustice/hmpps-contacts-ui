import { Request, Response } from 'express'
import AuditService, { Page } from '../../services/auditService'
import SEARCH_PRISONER_URL from '../urls'

export default class SearchController {
  constructor(private readonly auditService: AuditService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    await this.auditService.logPageView(Page.EXAMPLE_PAGE, { who: res.locals.user.username, correlationId: req.id })

    res.render('search/view', { validationErrors: res.locals.validationErrors })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect(SEARCH_PRISONER_URL)
  }
}
