import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { CreateContactAddressParam, getAddressFormAndUrl } from '../common/utils'
import { AddressTypeSchema } from '../../../manage/addresses/address-type/addressTypeSchemas'
import { getFormattedAddress } from '../../../manage/addresses/common/utils'

export default class CreateContactDeleteAddressController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_DELETE_ADDRESS_PAGE

  GET = async (req: Request<CreateContactAddressParam>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { addressForm, bounceBackUrl } = getAddressFormAndUrl(req)

    const phoneTypeDescriptions = new Map(
      (await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user)).map(refData => [
        refData.code,
        refData.description,
      ]),
    )

    const navigation: Navigation = {
      backLink: bounceBackUrl,
      cancelButton: bounceBackUrl,
    }
    const viewModel = {
      address: {
        ...addressForm,
        ...addressForm.addressMetadata,
        ...addressForm.addressLines,
        addressTypeDescription:
          addressForm.addressType !== 'DO_NOT_KNOW'
            ? await this.referenceDataService.getReferenceDescriptionForCode(
                ReferenceCodeType.ADDRESS_TYPE,
                addressForm.addressType!,
                user,
              )
            : undefined,
        phoneNumbers: addressForm.phoneNumbers?.map(phone => ({
          phoneNumber: phone.phoneNumber,
          extNumber: phone.extension,
          phoneTypeDescription: phoneTypeDescriptions.get(phone.type),
        })),
        ...(await getFormattedAddress(this.referenceDataService, addressForm, res.locals.user)),
      },
      navigation,
    }
    res.render('pages/contacts/add/addresses/delete', viewModel)
  }

  POST = async (req: Request<CreateContactAddressParam, unknown, AddressTypeSchema>, res: Response): Promise<void> => {
    const { journey, addressForm, bounceBackUrl } = getAddressFormAndUrl(req)
    journey.pendingAddresses = journey.pendingAddresses!.filter(address => address !== addressForm)
    if (journey.pendingAddresses.length === 0) delete journey.pendingAddresses
    res.redirect(bounceBackUrl)
  }
}
