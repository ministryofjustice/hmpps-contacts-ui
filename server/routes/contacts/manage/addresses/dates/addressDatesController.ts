import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { getAddressJourneyAndUrl, getFormattedAddress } from '../common/utils'
import { AddressDatesSchemaType } from './addressDatesSchemas'

export default class AddressDatesController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ENTER_ADDRESS_DATES_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)
    const navigation: Navigation = {
      backLink: checkAnswersOrAddressUrl({ subPath: 'enter-address' }),
    }
    const viewModel = {
      contact: journey.contactNames,
      navigation,
      formattedAddress: await getFormattedAddress(this.referenceDataService, journey, res.locals.user),
      fromMonth:
        res.locals?.formResponses?.['fromMonth'] ??
        journey.addressMetadata?.fromMonth ??
        String(new Date().getMonth() + 1),
      fromYear:
        res.locals?.formResponses?.['fromYear'] ??
        journey.addressMetadata?.fromYear ??
        String(new Date().getFullYear()),
      toMonth: res.locals?.formResponses?.['toMonth'] ?? journey.addressMetadata?.toMonth,
      toYear: res.locals?.formResponses?.['toYear'] ?? journey.addressMetadata?.toYear,
    }
    res.render('pages/contacts/manage/contactMethods/address/dates', viewModel)
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
      AddressDatesSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)
    journey.addressMetadata = {
      ...(journey.addressMetadata ?? {}),
      fromMonth: req.body.fromMonth,
      fromYear: req.body.fromYear,
      toMonth: req.body.toMonth,
      toYear: req.body.toYear,
    }
    res.redirect(checkAnswersOrAddressUrl({ subPath: 'primary-or-postal' }))
  }
}
