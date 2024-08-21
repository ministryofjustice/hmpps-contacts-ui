import { Request, Response } from 'express'
import { Page } from '../../services/auditService'
import { PageHandler } from '../../interfaces/pageHandler'

export default class ContactsController implements PageHandler {
  public PAGE_NAME = Page.SEARCH_PRISONER_CONTACT_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('contacts/view')
  }
}
