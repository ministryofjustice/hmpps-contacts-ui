import { Request, Response } from 'express'
import AuditService, { Page } from '../../services/auditService'

export default class ContactsController {
  constructor(private readonly auditService: AuditService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    await this.auditService.logPageView(Page.EXAMPLE_PAGE, { who: res.locals.user.username, correlationId: req.id })
    // res.render('pages/contacts')
    res.render('contacts/view')
  }
}
