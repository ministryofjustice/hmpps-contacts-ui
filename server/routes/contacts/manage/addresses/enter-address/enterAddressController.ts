import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { AddressLinesSchema } from './addressLinesSchemas'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class EnterAddressController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ENTER_ADDRESS_PAGE

  private DEFAULT_COUNTRY = 'ENG'

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user, prisonerDetails } = res.locals
    const journey = req.session.addressJourneys![journeyId]!

    let usePrisonerAddressEnabled = false
    if (prisonerDetails!.hasPrimaryAddress) {
      usePrisonerAddressEnabled = true
    }

    let typeLabel
    if (journey.addressType !== 'DO_NOT_KNOW') {
      typeLabel = await this.referenceDataService
        .getReferenceDescriptionForCode(ReferenceCodeType.ADDRESS_TYPE, journey.addressType!, user)
        .then(code => code?.toLowerCase())
    }
    typeLabel = typeLabel ?? 'address'

    const townOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.CITY, user)
      .then(val => this.getSelectedOptions(val, res.locals?.formResponses?.['town'] ?? journey.addressLines?.town))

    const countyOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.COUNTY, user)
      .then(val => this.getSelectedOptions(val, res.locals?.formResponses?.['county'] ?? journey.addressLines?.county))

    const selectedCountry =
      res.locals?.formResponses?.['country'] ?? journey.addressLines?.country ?? this.DEFAULT_COUNTRY
    const countryOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.COUNTRY, user)
      .then(val => this.getSelectedOptions(val, selectedCountry))

    const noFixedAddress =
      res.locals?.formResponses?.['noFixedAddress'] ?? (journey.addressLines?.noFixedAddress ? 'YES' : 'NO')
    const navigation: Navigation = {
      backLink: `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/address/select-type/${journeyId}`,
    }
    const viewModel = {
      journey,
      typeLabel,
      townOptions,
      countyOptions,
      countryOptions,
      navigation,
      usePrisonerAddress: {
        enabled: usePrisonerAddressEnabled,
        url: `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/address/use-prisoner-address/${journeyId}?returnUrl=/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/address/enter-address/${journeyId}`,
      },
      flat: res.locals?.formResponses?.['flat'] ?? journey.addressLines?.flat,
      premises: res.locals?.formResponses?.['premises'] ?? journey.addressLines?.premises,
      street: res.locals?.formResponses?.['street'] ?? journey.addressLines?.street,
      locality: res.locals?.formResponses?.['locality'] ?? journey.addressLines?.locality,
      postcode: res.locals?.formResponses?.['postcode'] ?? journey.addressLines?.postcode,
      noFixedAddress,
    }
    res.render('pages/contacts/manage/address/enterAddress', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
      },
      unknown,
      AddressLinesSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addressJourneys![journeyId]!
    const form: AddressLinesSchema = req.body
    journey.addressLines = {
      noFixedAddress: form.noFixedAddress === 'YES',
      flat: form.flat,
      premises: form.premises,
      street: form.street,
      locality: form.locality,
      town: form.town,
      county: form.county,
      postcode: form.postcode,
      country: form.country,
    }
    res.redirect(
      journey.isCheckingAnswers
        ? `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/address/check-answers/${journeyId}`
        : `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/address/address-metadata/${journeyId}`,
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
    return [
      { text: '', value: '' },
      ...options.map((referenceCode: ReferenceCode) => {
        return {
          text: referenceCode.description,
          value: referenceCode.code,
          selected: referenceCode.code === selected,
        }
      }),
    ]
  }
}
