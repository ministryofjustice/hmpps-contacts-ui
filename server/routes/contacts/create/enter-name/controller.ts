import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { SchemaType } from './schemas'

export default class EnterNameController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_NAME_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/contacts/create/enterName')
  }

  POST = async (req: Request<unknown, unknown, SchemaType>, res: Response): Promise<void> => {
    res.redirect('/contacts/create/success')
  }
}
