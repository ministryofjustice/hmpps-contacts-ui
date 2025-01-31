import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import RestrictionsService from '../../../../services/restrictionsService'
import { Page } from '../../../../services/auditService'

export default class UpdateEmploymentsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_EMPLOYMENTS_PAGE

  GET = async (req: Request, res: Response) => {
    res.end()
  }

  POST = async (req: Request, res: Response) => {
    res.end()
  }
}
