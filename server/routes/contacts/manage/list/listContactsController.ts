import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'

export default class ListContactsController implements PageHandler {
  public PAGE_NAME = Page.LIST_CONTACTS_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]
    res.render('pages/contacts/manage/listContacts', { journey })
  }
}
