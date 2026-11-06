import { Request, Response } from 'express'
import { isGranted } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import Permission from '../../../../enumeration/permission'
import ContactsService from '../../../../services/contactsService'
import AlertsService from '../../../../services/alertsService'
import { PageAlert } from '../../../../data/alertsApiTypes'
import { Navigation } from '../../common/navigation'
import config from '../../../../config'
import { MAINTAIN_RESTRICTIONS_PERMISSIONS } from '../../../prisoner-restrictions/prisonerRestrictionCommon'

export default class ListPrisonerRestrictionsAlertsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly alertsService: AlertsService,
  ) {}

  public PAGE_NAME = Page.VIEW_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  // Users who can maintain restrictions can open this page even without edit_contacts (e.g. ROLE_UPDATE_ALERT only)
  public ACCEPTED_PERMISSIONS = config.feature.prisonerRestrictionsMaintenanceEnabled
    ? [Permission.edit_contacts, ...MAINTAIN_RESTRICTIONS_PERMISSIONS]
    : undefined

  GET = async (req: Request<{ prisonerNumber: string }>, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const { prisonerDetails, user, prisonerProfileUrl, prisonerPermissions } = res.locals
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
    const alertForPrisoner = prisonerAlertsContent.content

    const navigation: Navigation = { breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_ALERTS_RESTRICTIONS'] }
    const viewModel = {
      caption: 'Link a contact to a prisoner',
      title: 'Review prisoner and contact restrictions',
      prisonerDetails,
      prisonerRestrictions,
      alertForPrisoner,
      navigation,
      prisonerProfileUrl,
      prisonerRestrictionsMaintenanceEnabled: config.feature.prisonerRestrictionsMaintenanceEnabled,
      canMaintainPrisonerRestrictions: MAINTAIN_RESTRICTIONS_PERMISSIONS.some(permission =>
        isGranted(permission, prisonerPermissions),
      ),
    }

    res.render('pages/contacts/restrictions/reviewRestrictions', viewModel)
  }
}
