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
        url: `${addressUrl({ subPath: 'use-prisoner-address' })}?returnUrl=${addressUrl({ subPath: 'enter-address' })}`,
      },
      noFixedAddress:
        res.locals?.formResponses?.['noFixedAddress'] ?? (journey.addressLines?.noFixedAddress ? 'YES' : 'NO'),
      flat: res.locals?.formResponses?.['flat'] ?? journey.addressLines?.flat,
      property: res.locals?.formResponses?.['property'] ?? journey.addressLines?.property,
      street: res.locals?.formResponses?.['street'] ?? journey.addressLines?.street,
      area: res.locals?.formResponses?.['area'] ?? journey.addressLines?.area,
      cityCode: res.locals?.formResponses?.['cityCode'] ?? journey.addressLines?.cityCode,
      countyCode: res.locals?.formResponses?.['countyCode'] ?? journey.addressLines?.countyCode,
      postcode: res.locals?.formResponses?.['postcode'] ?? journey.addressLines?.postcode,
      countryCode:
        res.locals?.formResponses?.['countryCode'] ?? journey.addressLines?.countryCode ?? this.DEFAULT_COUNTRY,
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
