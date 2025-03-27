import { Request, Response } from 'express'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../services/referenceDataService'
import { Navigation } from '../../contacts/common/navigation'
import { maxLengthForRestrictionClass, RestrictionSchemaType } from '../schema/restrictionSchema'
import { formatNameFirstNameFirst } from '../../../utils/formatName'
import Urls from '../../urls'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import RestrictionClass = journeys.RestrictionClass

export default class EnterNewRestrictionController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ENTER_RESTRICTION_PAGE

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
    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.RESTRICTION, user)
      .then(val => this.getSelectedOptions(val, res.locals?.formResponses?.['type'] ?? journey?.restriction?.type))
    const navigation: Navigation = {
      backLink: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId, 'restrictions'),
    }
    let title
    if (restrictionClass === 'PRISONER_CONTACT') {
      title = 'Add a new prisoner-contact restriction'
    } else {
      title = `Add a new global restriction for ${formatNameFirstNameFirst(journey.contactNames, {
        excludeMiddleNames: true,
      })}`
    }
    const viewModel = {
      journey,
      typeOptions,
      title,
      type: res.locals?.formResponses?.['type'] ?? journey?.restriction?.type,
      startDate: res.locals?.formResponses?.['startDate'] ?? journey?.restriction?.startDate,
      expiryDate: res.locals?.formResponses?.['expiryDate'] ?? journey?.restriction?.expiryDate,
      comments: res.locals?.formResponses?.['comments'] ?? journey?.restriction?.comments,
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

  private getSelectedOptions(
    options: ReferenceCode[],
    selectedOption?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options.map((referenceCode: ReferenceCode) => {
      return {
        text: referenceCode.description,
        value: referenceCode.code,
        selected: referenceCode.code === selectedOption,
      }
    })
    return [{ text: 'Select restriction type', value: '' }, ...mappedOptions]
  }
}
