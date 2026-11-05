import { Request, Response } from 'express'
import { Page } from '../../services/auditService'
import { PageHandler } from '../../interfaces/pageHandler'
import ContactsService from '../../services/contactsService'
import RestrictionsService from '../../services/restrictionsService'
import { Navigation } from '../contacts/common/navigation'
import { FLASH_KEY__SUCCESS_BANNER } from '../../middleware/setUpSuccessNotificationBanner'
import Permission from '../../enumeration/permission'
import Urls from '../urls'

import { RestrictionParams, prisonerName } from './prisonerRestrictionCommon'

export default class DeletePrisonerRestrictionController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.DELETE_PRISONER_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contact_restrictions

  GET = async (req: Request<RestrictionParams>, res: Response): Promise<void> => {
    const { prisonerNumber, prisonerRestrictionId } = req.params
    const restriction = await this.contactsService.getPrisonerRestriction(
      prisonerNumber,
      Number(prisonerRestrictionId),
      res.locals.user,
    )
    if (!restriction) {
      throw new Error(`Couldn't find prisoner restriction ${prisonerRestrictionId} for ${prisonerNumber}`)
    }
    const navigation: Navigation = {
      backLink: Urls.prisonerRestrictions(prisonerNumber),
      cancelButton: Urls.prisonerRestrictions(prisonerNumber),
    }
    res.render('pages/prisoner-restrictions/confirmDeletePrisonerRestriction', { restriction, navigation })
  }

  POST = async (req: Request<RestrictionParams>, res: Response): Promise<void> => {
    const { prisonerNumber, prisonerRestrictionId } = req.params
    await this.restrictionsService.deletePrisonerRestriction(
      prisonerNumber,
      Number(prisonerRestrictionId),
      res.locals.user,
      req.id,
    )
    req.flash(FLASH_KEY__SUCCESS_BANNER, `You’ve deleted a restriction for ${prisonerName(res)}`)
    res.redirect(Urls.prisonerRestrictions(prisonerNumber))
  }
}
