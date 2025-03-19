import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { CreateContactAddressParam, getAddressFormAndUrl } from '../common/utils'
import { getFormattedAddress } from '../../../manage/addresses/common/utils'
import { AddressCommentsSchemaType } from '../../../manage/addresses/comments/addressCommentsSchema'

export default class CreateContactAddressCommentsController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_ENTER_ADDRESS_COMMENTS_PAGE

  GET = async (req: Request<CreateContactAddressParam>, res: Response): Promise<void> => {
    const { journey, addressForm, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)
    const navigation: Navigation = {
      backLink: bounceBackOrAddressUrl({ subPath: 'phone/create' }),
    }
    const viewModel = {
      caption: 'Add a contact and link to a prisoner',
      continueButtonLabel: 'Continue',
      contact: journey.names,
      navigation,
      formattedAddress: await getFormattedAddress(this.referenceDataService, addressForm, res.locals.user),
      comments: res.locals?.formResponses?.['comments'] ?? addressForm.addressMetadata?.comments,
    }
    res.render('pages/contacts/manage/contactMethods/address/comments', viewModel)
  }

  POST = async (
    req: Request<CreateContactAddressParam, unknown, AddressCommentsSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { isNew, journey, addressForm, bounceBackUrl } = getAddressFormAndUrl(req)
    addressForm.addressMetadata = {
      ...(addressForm.addressMetadata ?? {}),
      comments: req.body.comments,
    }

    if (isNew) {
      journey.pendingAddresses ??= []
      if (addressForm.addressMetadata.primaryAddress) {
        journey.pendingAddresses = journey.pendingAddresses.map(address => ({
          ...address,
          addressMetadata: {
            ...address.addressMetadata,
            primaryAddress: false,
          },
        }))
      }
      if (addressForm.addressMetadata.mailAddress) {
        journey.pendingAddresses = journey.pendingAddresses.map(address => ({
          ...address,
          addressMetadata: {
            ...address.addressMetadata,
            mailAddress: false,
          },
        }))
      }
      journey.pendingAddresses.push(addressForm)
    }

    res.redirect(bounceBackUrl)
  }
}
