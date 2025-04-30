import { Request, Response } from 'express'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../services/referenceDataService'
import { Navigation } from '../../contacts/common/navigation'
import { maxLengthForRestrictionClass, RestrictionSchemaType } from '../schema/restrictionSchema'
import Urls from '../../urls'
import { RestrictionClass } from '../../../@types/journeys'
import Permission from '../../../enumeration/permission'

export default class EnterNewRestrictionController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ENTER_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_RESTRICTIONS

  GET = async (
    req: Request<{
      journeyId: string
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      restrictionClass: RestrictionClass
    }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    const { user } = res.locals
    const journey = req.session.addRestrictionJourneys![journeyId]!
    const types = await this.referenceDataService.getReferenceData(ReferenceCodeType.RESTRICTION, user)
    const navigation: Navigation = {
      backLink: Urls.editRestrictions(prisonerNumber, contactId, prisonerContactId),
    }

    const viewModel = {
      journey,
      types,
      isNewRestriction: true,
      type: res.locals?.formResponses?.['type'] ?? journey?.restriction?.type,
      startDate: res.locals?.formResponses?.['startDate'] ?? journey?.restriction?.startDate,
      expiryDate: res.locals?.formResponses?.['expiryDate'] ?? journey?.restriction?.expiryDate,
      comments: res.locals?.formResponses?.['comments'] ?? journey?.restriction?.comments,
      navigation,
      maxCommentLength: maxLengthForRestrictionClass(restrictionClass),
    }
    res.render('pages/contacts/restrictions/enterRestriction', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        restrictionClass: RestrictionClass
      },
      unknown,
      RestrictionSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    const { type, startDate, expiryDate, comments } = req.body
    const journey = req.session.addRestrictionJourneys![journeyId]!
    journey.restriction = { type, startDate, expiryDate, comments }
    res.redirect(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/check-answers/${journeyId}`,
    )
  }
}
