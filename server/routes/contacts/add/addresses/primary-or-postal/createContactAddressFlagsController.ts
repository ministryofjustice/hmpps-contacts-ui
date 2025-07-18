import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { CreateContactAddressParam, getAddressFormAndUrl } from '../common/utils'
import { getFormattedAddress } from '../../../manage/addresses/common/utils'
import { AddressFlagsSchemaType } from '../../../manage/addresses/primary-or-postal/addressFlagsSchemas'
import Permission from '../../../../../enumeration/permission'

export default class CreateContactAddressFlagsController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_SELECT_ADDRESS_FLAGS_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<CreateContactAddressParam>, res: Response): Promise<void> => {
    const { journey, addressForm, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)
    const navigation: Navigation = {
      backLink: bounceBackOrAddressUrl({ subPath: 'dates' }),
    }
    const viewModel = {
      isNewContact: true,
      journey,
      contact: journey.names,
      navigation,
      formattedAddress: await getFormattedAddress(this.referenceDataService, addressForm, res.locals.user),
      primaryAddress: addressForm.addressMetadata?.primaryAddress,
      mailAddress: addressForm.addressMetadata?.mailAddress,
    }
    res.render('pages/contacts/manage/contactMethods/address/primaryOrPostal', viewModel)
  }

  POST = async (
    req: Request<CreateContactAddressParam, unknown, AddressFlagsSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { isNew, journey, addressForm, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)
    addressForm.addressMetadata = {
      ...(addressForm.addressMetadata ?? {}),
      primaryAddress: req.body.primaryAddress,
      mailAddress: req.body.mailAddress,
    }

    if (!isNew) {
      if (addressForm.addressMetadata.primaryAddress) {
        journey.pendingAddresses = journey.pendingAddresses!.map(address =>
          address === addressForm
            ? address
            : {
                ...address,
                addressMetadata: {
                  ...address.addressMetadata,
                  primaryAddress: false,
                },
              },
        )
      }
      if (addressForm.addressMetadata.mailAddress) {
        journey.pendingAddresses = journey.pendingAddresses!.map(address =>
          address === addressForm
            ? address
            : {
                ...address,
                addressMetadata: {
                  ...address.addressMetadata,
                  mailAddress: false,
                },
              },
        )
      }
    }
    res.redirect(bounceBackOrAddressUrl({ subPath: 'phone/create' }))
  }
}
