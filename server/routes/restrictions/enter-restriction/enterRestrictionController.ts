import { Request, Response } from 'express'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../services/referenceDataService'
import { Navigation } from '../../contacts/common/navigation'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import RestrictionClass = journeys.RestrictionClass
import { maxLengthForRestrictionClass, RestrictionSchemaType } from '../schema/restrictionSchema'

export default class EnterRestrictionController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ENTER_RESTRICTION_PAGE

  GET = async (
    req: Request<{
      journeyId: string
      restrictionClass: RestrictionClass
    }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, restrictionClass } = req.params
    const { user } = res.locals
    const journey = req.session.addRestrictionJourneys[journeyId]
    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.RESTRICTION, user)
      .then(val => this.getSelectedOptions(val, res.locals?.formResponses?.type ?? journey?.restriction?.type))
    const navigation: Navigation = {
      backLink: journey.returnPoint.url,
    }
    const viewModel = {
      journey,
      typeOptions,
      type: res.locals?.formResponses?.type ?? journey?.restriction?.type,
      startDate: res.locals?.formResponses?.startDate ?? journey?.restriction?.startDate,
      expiryDate: res.locals?.formResponses?.expiryDate ?? journey?.restriction?.expiryDate,
      comments: res.locals?.formResponses?.comments ?? journey?.restriction?.comments,
      navigation,
      maxCommentLength: maxLengthForRestrictionClass(restrictionClass),
      continueButtonLabel: 'Continue',
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
        restrictionClass: string
      },
      unknown,
      RestrictionSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    const { type, startDate, expiryDate, comments } = req.body
    const journey = req.session.addRestrictionJourneys[journeyId]
    journey.restriction = { type, startDate, expiryDate, comments }
    res.redirect(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/check-answers/${journeyId}`,
    )
  }

  private getSelectedOptions(
    options: ReferenceCode[],
    selectedOption?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options
      .map((title: ReferenceCode) => {
        return {
          text: title.description,
          value: title.code,
          selected: title.code === selectedOption,
        }
      })
      .sort((a, b) => a.text.localeCompare(b.text))
    return [{ text: 'Select restriction type', value: '' }, ...mappedOptions]
  }
}
