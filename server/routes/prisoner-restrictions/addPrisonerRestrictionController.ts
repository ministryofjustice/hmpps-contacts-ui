import { Request, Response } from 'express'
import { Page } from '../../services/auditService'
import { PageHandler } from '../../interfaces/pageHandler'
import ReferenceCodeType from '../../enumeration/referenceCodeType'
import ReferenceDataService from '../../services/referenceDataService'
import RestrictionsService from '../../services/restrictionsService'
import { Navigation } from '../contacts/common/navigation'
import { RestrictionSchemaType } from '../restrictions/schema/restrictionSchema'
import { FLASH_KEY__SUCCESS_BANNER } from '../../middleware/setUpSuccessNotificationBanner'
import Permission from '../../enumeration/permission'
import Urls from '../urls'

import { PrisonerParams, MAX_COMMENT_LENGTH, prisonerName } from './prisonerRestrictionCommon'

export default class AddPrisonerRestrictionController implements PageHandler {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.ADD_PRISONER_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contact_restrictions

  GET = async (req: Request<PrisonerParams>, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    const types = await this.referenceDataService.getReferenceData(ReferenceCodeType.RESTRICTION, res.locals.user)
    const navigation: Navigation = {
      backLink: Urls.prisonerRestrictions(prisonerNumber),
      cancelButton: Urls.prisonerRestrictions(prisonerNumber),
    }
    res.render('pages/prisoner-restrictions/enterPrisonerRestriction', {
      isNewRestriction: true,
      types,
      type: res.locals?.formResponses?.['type'],
      startDate: res.locals?.formResponses?.['startDate'],
      expiryDate: res.locals?.formResponses?.['expiryDate'],
      comments: res.locals?.formResponses?.['comments'],
      maxCommentLength: MAX_COMMENT_LENGTH,
      navigation,
    })
  }

  POST = async (req: Request<PrisonerParams, unknown, RestrictionSchemaType>, res: Response): Promise<void> => {
    const { prisonerNumber } = req.params
    await this.restrictionsService.createPrisonerRestriction(prisonerNumber, req.body, res.locals.user, req.id)
    req.flash(FLASH_KEY__SUCCESS_BANNER, `You’ve added a restriction for ${prisonerName(res)}`)
    res.redirect(Urls.prisonerRestrictions(prisonerNumber))
  }
}
