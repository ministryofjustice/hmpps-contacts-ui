import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'

export default class SuccessController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_SUCCESS_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/contacts/create/success')
  }
}
