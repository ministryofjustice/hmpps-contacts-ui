import { Request, Response } from 'express'
import { Page } from '../../services/auditService'
import { PageHandler } from '../../interfaces/pageHandler'
import SEARCH_PRISONER_URL from '../urls'

export default class SearchController implements PageHandler {
  public PAGE_NAME = Page.SEARCH_PRISONERS_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('search/view', { validationErrors: res.locals.validationErrors })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect(SEARCH_PRISONER_URL)
  }
}
