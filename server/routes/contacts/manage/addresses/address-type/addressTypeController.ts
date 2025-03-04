import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { AddressTypeSchema } from './addressTypeSchemas'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import Urls from '../../../../urls'

export default class AddressTypeController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.SELECT_ADDRESS_TYPE_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addressJourneys![journeyId]!

    const typeOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.ADDRESS_TYPE, user)

    const navigation: Navigation = {
      backLink: journey.isCheckingAnswers
        ? `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`
        : Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      caption: 'Edit contact methods',
      continueButtonLabel: 'Continue',
      contact: journey.contactNames,
      addressType: res.locals?.formResponses?.['type'] ?? journey.addressType,
      typeOptions,
      navigation,
    }
    res.render('pages/contacts/manage/contactMethods/address/addressType', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        journeyId: string
      },
      unknown,
      AddressTypeSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, journeyId } = req.params
    const journey = req.session.addressJourneys![journeyId]!
    const { addressType } = req.body
    journey.addressType = addressType
    res.redirect(
      journey.isCheckingAnswers
        ? `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/check-answers/${journeyId}`
        : `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/enter-address/${journeyId}`,
    )
  }
}
