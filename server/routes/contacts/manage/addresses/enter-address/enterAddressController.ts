import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { AddressLinesSchema } from './addressLinesSchemas'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { getAddressJourneyAndUrl } from '../common/utils'

export default class EnterAddressController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ENTER_ADDRESS_PAGE

  private DEFAULT_COUNTRY = 'ENG'

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { journey, addressUrl, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)

    const townOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.CITY, user)
    const countyOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.COUNTY, user)
    const countryOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.COUNTRY, user)

    const navigation: Navigation = {
      backLink: checkAnswersOrAddressUrl({ subPath: 'select-type' }),
    }
    const viewModel = {
      caption: 'Edit contact methods',
      continueButtonLabel: 'Continue',
      contact: journey.contactNames,
      navigation,
      townOptions,
      countyOptions,
      countryOptions,
      usePrisonerAddress: {
        enabled: prisonerDetails!.hasPrimaryAddress,
        url: `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/address/use-prisoner-address/${journey.id}?returnUrl=${addressUrl({ subPath: 'enter-address' })}`,
      },
      noFixedAddress:
        res.locals?.formResponses?.['noFixedAddress'] ?? (journey.addressLines?.noFixedAddress ? 'YES' : 'NO'),
      flat: res.locals?.formResponses?.['flat'] ?? journey.addressLines?.flat,
      premises: res.locals?.formResponses?.['premises'] ?? journey.addressLines?.premises,
      street: res.locals?.formResponses?.['street'] ?? journey.addressLines?.street,
      locality: res.locals?.formResponses?.['locality'] ?? journey.addressLines?.locality,
      town: res.locals?.formResponses?.['town'] ?? journey.addressLines?.town,
      county: res.locals?.formResponses?.['county'] ?? journey.addressLines?.county,
      postcode: res.locals?.formResponses?.['postcode'] ?? journey.addressLines?.postcode,
      country: res.locals?.formResponses?.['country'] ?? journey.addressLines?.country ?? this.DEFAULT_COUNTRY,
    }
    res.render('pages/contacts/manage/contactMethods/address/enterAddress', viewModel)
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
      AddressLinesSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)
    const { noFixedAddress, _csrf, ...requestBody } = req.body
    journey.addressLines = {
      ...requestBody,
      noFixedAddress: noFixedAddress === 'YES',
    }
    res.redirect(checkAnswersOrAddressUrl({ subPath: 'dates' }))
  }
}
