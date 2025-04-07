import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { CreateContactAddressParam, getAddressFormAndUrl } from '../common/utils'
import { AddressLinesSchema } from '../../../manage/addresses/enter-address/addressLinesSchemas'

export default class CreateContactEnterAddressController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_ENTER_ADDRESS_PAGE

  private DEFAULT_COUNTRY = 'ENG'

  GET = async (req: Request<CreateContactAddressParam>, res: Response): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { isNew, journey, addressUrl, addressForm, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)

    const townOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.CITY, user)
    const countyOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.COUNTY, user)
    const countryOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.COUNTRY, user)

    const navigation: Navigation = {
      backLink: bounceBackOrAddressUrl({ subPath: 'select-type' }),
    }
    const viewModel = {
      isNewContact: true,
      journey,
      contact: journey.names,
      navigation,
      townOptions,
      countyOptions,
      countryOptions,
      usePrisonerAddress: {
        enabled: isNew && prisonerDetails!.hasPrimaryAddress,
        url: `${addressUrl({ subPath: 'use-prisoner-address' })}?returnUrl=${addressUrl({ subPath: 'enter-address' })}`,
      },
      noFixedAddress:
        res.locals?.formResponses?.['noFixedAddress'] ?? (addressForm.addressLines?.noFixedAddress ? 'YES' : 'NO'),
      flat: res.locals?.formResponses?.['flat'] ?? addressForm.addressLines?.flat,
      property: res.locals?.formResponses?.['property'] ?? addressForm.addressLines?.property,
      street: res.locals?.formResponses?.['street'] ?? addressForm.addressLines?.street,
      area: res.locals?.formResponses?.['area'] ?? addressForm.addressLines?.area,
      cityCode: res.locals?.formResponses?.['cityCode'] ?? addressForm.addressLines?.cityCode,
      countyCode: res.locals?.formResponses?.['countyCode'] ?? addressForm.addressLines?.countyCode,
      postcode: res.locals?.formResponses?.['postcode'] ?? addressForm.addressLines?.postcode,
      countryCode:
        res.locals?.formResponses?.['countryCode'] ?? addressForm.addressLines?.countryCode ?? this.DEFAULT_COUNTRY,
    }
    res.render('pages/contacts/manage/contactMethods/address/enterAddress', viewModel)
  }

  POST = async (req: Request<CreateContactAddressParam, unknown, AddressLinesSchema>, res: Response): Promise<void> => {
    const { addressForm, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)
    const { noFixedAddress, _csrf, ...requestBody } = req.body
    addressForm.addressLines = {
      ...requestBody,
      noFixedAddress: noFixedAddress === 'YES',
    }
    res.redirect(bounceBackOrAddressUrl({ subPath: 'dates' }))
  }
}
