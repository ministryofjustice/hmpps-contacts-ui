import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { CreateContactEnterDobSchemaType } from './createContactEnterDobSchemas'

export default class CreateContactEnterDobController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_DOB_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    res.render('pages/contacts/create/enterDob', { journey })
  }

  POST = async (req: Request<unknown, unknown, CreateContactEnterDobSchemaType>, res: Response): Promise<void> => {
    res.redirect('/contacts/create/success')
  }
}
