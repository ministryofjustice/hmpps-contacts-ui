import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { getAddressJourneyAndUrl, getFormattedAddress } from '../common/utils'
import { AddressFlagsSchemaType } from './addressFlagsSchemas'

export default class AddressFlagsController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.SELECT_ADDRESS_FLAGS_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)
    const navigation: Navigation = {
      backLink: checkAnswersOrAddressUrl({ subPath: 'dates' }),
    }
    const viewModel = {
      caption: 'Edit contact methods',
      continueButtonLabel: 'Continue',
      contact: journey.contactNames,
      navigation,
      formattedAddress: await getFormattedAddress(this.referenceDataService, journey, res.locals.user),
      primaryAddress: journey.addressMetadata?.primaryAddress,
      mailAddress: journey.addressMetadata?.mailAddress,
    }
    res.render('pages/contacts/manage/contactMethods/address/primaryOrPostal', viewModel)
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
      AddressFlagsSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)
    journey.addressMetadata = {
      ...(journey.addressMetadata ?? {}),
      primaryAddress: req.body.primaryAddress,
      mailAddress: req.body.mailAddress,
    }
    res.redirect(checkAnswersOrAddressUrl({ subPath: 'phone' }))
  }
}
