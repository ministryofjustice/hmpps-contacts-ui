import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { CreateContactAddressParam, getAddressFormAndUrl } from '../common/utils'
import { getFormattedAddress } from '../../../manage/addresses/common/utils'
import { OptionalPhonesSchemaType } from '../../../manage/addresses/add-address-phone/AddAddressPhonesSchema'
import Permission from '../../../../../enumeration/permission'

export default class CreateContactAddressPhoneController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_ADD_ADDRESS_PHONE_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (req: Request<CreateContactAddressParam>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { addressForm, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)
    const navigation: Navigation = {
      backLink: bounceBackOrAddressUrl({ subPath: 'primary-or-postal' }),
    }
    const viewModel = {
      isNewContact: true,
      navigation,
      typeOptions: await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user),
      formattedAddress: await getFormattedAddress(this.referenceDataService, addressForm, res.locals.user),
      phones: res.locals?.formResponses?.['phones'] ??
        addressForm.phoneNumbers ?? [{ type: '', phoneNumber: '', extension: '' }],
    }
    res.render('pages/contacts/manage/contactMethods/address/phone/addAddressPhone', viewModel)
  }

  POST = async (
    req: Request<CreateContactAddressParam, unknown, OptionalPhonesSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { addressForm, addressUrl, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)
    const { phones, save, add, remove } = req.body
    if (save !== undefined) {
      addressForm.phoneNumbers = phones
      res.redirect(bounceBackOrAddressUrl({ subPath: 'comments' }))
    } else {
      req.body.phones ??= [{ type: '', phoneNumber: '', extension: '' }]
      if (add !== undefined) {
        req.body.phones.push({ type: '', phoneNumber: '', extension: '' })
      } else if (remove !== undefined) {
        req.body.phones.splice(Number(remove), 1)
      }
      // Always redirect back to input even if we didn't find an action, which should be impossible but there is a small
      // possibility if JS is disabled after a page load or the user somehow removes all identities.
      req.flash('formResponses', JSON.stringify(req.body))
      res.redirect(addressUrl({ subPath: 'phone/create' }))
    }
  }
}
