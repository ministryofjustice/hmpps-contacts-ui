import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { getAddressJourneyAndUrl, getFormattedAddress } from '../common/utils'
import { AddressCommentsSchemaType } from './addressCommentsSchema'

export default class AddressCommentsController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ENTER_ADDRESS_COMMENTS_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)
    const navigation: Navigation = {
      backLink: checkAnswersOrAddressUrl({ subPath: 'phone' }),
    }
    const viewModel = {
      contact: journey.contactNames,
      navigation,
      formattedAddress: await getFormattedAddress(this.referenceDataService, journey, res.locals.user),
      comments: res.locals?.formResponses?.['comments'] ?? journey.addressMetadata?.comments,
    }
    res.render('pages/contacts/manage/contactMethods/address/comments', viewModel)
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
      AddressCommentsSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)
    journey.addressMetadata = {
      ...(journey.addressMetadata ?? {}),
      comments: req.body.comments,
    }
    res.redirect(checkAnswersOrAddressUrl({ subPath: 'check-answers' }))
  }
}
