import { Request, Response } from 'express'
import config from '../../../../config'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import { Navigation } from '../../common/navigation'
import PrisonerContactSummaryPage = contactsApiClientTypes.PrisonerContactSummaryPage

type PageableObject = components['schemas']['PageableObject']

export default class ListContactsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.LIST_CONTACTS_PAGE

  GET = async (req: Request<{ prisonerNumber: string }, unknown, unknown>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber } = req.params
    const { tab } = req.query
    const page = Number(req.query['page'] as unknown) || 0
    const pageSize = config.apis.contactsApi.pageSize || 10

    const activeContacts: PrisonerContactSummaryPage[] = await this.contactsService.getPrisonerContacts(
      prisonerNumber as string,
      true,
      user,
      { page, size: pageSize } as PageableObject,
    )

    const inactiveContacts: PrisonerContactSummaryPage[] = await this.contactsService.getPrisonerContacts(
      prisonerNumber as string,
      false,
      user,
      { page, size: pageSize } as PageableObject,
    )
    const navigation: Navigation = { breadcrumbs: ['DPS_HOME', 'DPS_PROFILE'] }
    res.render('pages/contacts/manage/listContacts', {
      tab,
      activeContacts,
      inactiveContacts,
      prisonerNumber,
      navigation,
    })
  }
}
