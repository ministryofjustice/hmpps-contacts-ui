import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import Permission from '../../../../enumeration/permission'
import ContactsService from '../../../../services/contactsService'
import AlertsService from '../../../../services/alertsService'
import { PageAlert } from '../../../../data/alertsApiTypes'

export default class ListPrisonerRestrictionsAlertsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly alertsService: AlertsService,
  ) {}

  public PAGE_NAME = Page.VIEW_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.read_contacts

  GET = async (req: Request<{ prisonerNumber: string }>, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const { user } = res.locals
    const { prisonerDetails } = res.locals
    const prisonerRestrictionsContent = await this.contactsService.getPrisonerRestrictions(
      prisonerNumber,
      0,
      10,
      user,
      true,
    )
    const prisonerAlertsContent: PageAlert = await this.alertsService.getAlerts(prisonerNumber, user)
    const prisonerRestrictions = prisonerRestrictionsContent.content
    const prisonerAlerts = prisonerAlertsContent.content

    const viewModel = {
      caption: 'Link a contact to a prisoner',
      title: 'Review prisoner and contact restrictions',
      prisonerDetails,
      prisonerRestrictions,
      prisonerAlerts,
    }

    res.render('pages/contacts/restrictions/reviewRestrictions', viewModel)
  }
}
