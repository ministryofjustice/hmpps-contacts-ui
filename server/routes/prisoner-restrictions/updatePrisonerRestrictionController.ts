import { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { Page } from '../../services/auditService'
import { PageHandler } from '../../interfaces/pageHandler'
import ReferenceCodeType from '../../enumeration/referenceCodeType'
import ReferenceDataService from '../../services/referenceDataService'
import ContactsService from '../../services/contactsService'
import RestrictionsService from '../../services/restrictionsService'
import { Navigation } from '../contacts/common/navigation'
import { RestrictionSchemaType } from '../restrictions/schema/restrictionSchema'
import { FLASH_KEY__SUCCESS_BANNER } from '../../middleware/setUpSuccessNotificationBanner'
import Permission from '../../enumeration/permission'
import Urls from '../urls'

import {
  RestrictionParams,
  MAX_COMMENT_LENGTH,
  formatDateForDatePicker,
  prisonerName,
} from './prisonerRestrictionCommon'

export default class UpdatePrisonerRestrictionController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.UPDATE_PRISONER_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (req: Request<RestrictionParams>, res: Response): Promise<void> => {
    const { prisonerNumber, prisonerRestrictionId } = req.params
    const { user } = res.locals
    const existing = await this.contactsService.getPrisonerRestriction(
      prisonerNumber,
      Number(prisonerRestrictionId),
      user,
    )
    if (!existing) {
      throw new NotFound(`Couldn't find prisoner restriction ${prisonerRestrictionId} for ${prisonerNumber}`)
    }
    const types = await this.referenceDataService.getReferenceData(ReferenceCodeType.RESTRICTION, user)
    const navigation: Navigation = {
      backLink: Urls.prisonerRestrictions(prisonerNumber),
      cancelButton: Urls.prisonerRestrictions(prisonerNumber),
    }
    res.render('pages/prisoner-restrictions/enterPrisonerRestriction', {
      isNewRestriction: false,
      types,
      type: res.locals?.formResponses?.['type'] ?? existing.restrictionType,
      startDate: res.locals?.formResponses?.['startDate'] ?? formatDateForDatePicker(existing.effectiveDate),
      expiryDate: res.locals?.formResponses?.['expiryDate'] ?? formatDateForDatePicker(existing.expiryDate),
      comments: res.locals?.formResponses?.['comments'] ?? existing.commentText,
      maxCommentLength: MAX_COMMENT_LENGTH,
      navigation,
    })
  }

  POST = async (req: Request<RestrictionParams, unknown, RestrictionSchemaType>, res: Response): Promise<void> => {
    const { prisonerNumber, prisonerRestrictionId } = req.params
    await this.restrictionsService.updatePrisonerRestriction(
      prisonerNumber,
      Number(prisonerRestrictionId),
      req.body,
      res.locals.user,
      req.id,
    )
    req.flash(FLASH_KEY__SUCCESS_BANNER, `You’ve updated a restriction for ${prisonerName(res)}`)
    res.redirect(Urls.prisonerRestrictions(prisonerNumber))
  }
}
