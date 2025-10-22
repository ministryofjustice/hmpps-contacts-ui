import { Request, Response } from 'express'
import { getAlertFlagLabelsForAlerts } from '@ministryofjustice/hmpps-connect-dps-shared-items'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import Permission from '../../../../enumeration/permission'
import ContactsService from '../../../../services/contactsService'
import AlertsService from '../../../../services/alertsService'
import { PageAlert } from '../../../../data/alertsApiTypes'
import { Navigation } from '../../common/navigation'

export default class ListPrisonerRestrictionsAlertsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly alertsService: AlertsService,
  ) {}

  public PAGE_NAME = Page.VIEW_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (req: Request<{ prisonerNumber: string }>, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const { prisonerDetails, user, prisonerProfileUrl } = res.locals
    const prisonerRestrictionsContent = await this.contactsService.getPrisonerRestrictions(
      prisonerNumber,
      0,
      10,
      user,
      false,
      false,
    )
    const prisonerAlertsContent: PageAlert = await this.alertsService.getAlerts(prisonerNumber, user)
    const prisonerRestrictions = prisonerRestrictionsContent.content
    const prisonerAlerts = prisonerAlertsContent.content

    const alertForPrisoner = (prisonerAlerts ?? []).map(alert => ({
      ...alert,
      flagLabels: getAlertFlagLabelsForAlerts([
        {
          alertType: '',
          alertCode: alert.alertCode.code,
          active: alert.isActive,
          expired: !alert.isActive,
        },
      ]),
    }))

    const navigation: Navigation = { breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_ALERTS_RESTRICTIONS'] }
    const viewModel = {
      caption: 'Link a contact to a prisoner',
      title: 'Review prisoner and contact restrictions',
      prisonerDetails,
      prisonerRestrictions,
      alertForPrisoner,
      navigation,
      prisonerProfileUrl,
    }

    res.render('pages/contacts/restrictions/reviewRestrictions', viewModel)
  }
}
