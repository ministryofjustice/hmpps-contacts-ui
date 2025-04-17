import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { getAddressJourneyAndUrl } from '../common/utils'
import { PrisonerJourneyParams } from '../../../../../@types/journeys'

export default class AddressTypeController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.SELECT_ADDRESS_TYPE_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)

    const typeOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.ADDRESS_TYPE, user)

    const navigation: Navigation = {
      backLink: checkAnswersOrAddressUrl({
        fullPath: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      }),
    }
    const viewModel = {
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
      { addressType?: string }
    >,
    res: Response,
  ): Promise<void> => {
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)
    journey.addressType = req.body.addressType
    res.redirect(checkAnswersOrAddressUrl({ subPath: 'enter-address' }))
  }
}
