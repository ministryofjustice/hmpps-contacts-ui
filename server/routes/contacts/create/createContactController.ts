import { Request, Response } from 'express'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'

export default class CreateContactController implements PageHandler {
  public PAGE_NAME = Page.SEARCH_PRISONER_CONTACT_NAME_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('contacts/viewCreateContact')
  }
}
