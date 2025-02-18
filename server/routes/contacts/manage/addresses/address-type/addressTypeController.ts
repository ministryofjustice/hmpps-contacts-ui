import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { AddressTypeSchema } from './addressTypeSchemas'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
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

    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.ADDRESS_TYPE, user)
      .then(val => this.getSelectedOptions(val, res.locals?.formResponses?.['type'] ?? journey.addressType))

    const navigation: Navigation = { backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId) }
    const viewModel = {
      journey,
      typeOptions,
      navigation,
    }
    res.render('pages/contacts/manage/address/addressType', viewModel)
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

  private getSelectedOptions(
    options: ReferenceCode[],
    selected?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    return options.map((referenceCode: ReferenceCode) => {
      return {
        text: referenceCode.description,
        value: referenceCode.code,
        checked: referenceCode.code === selected,
      }
    })
  }
}
