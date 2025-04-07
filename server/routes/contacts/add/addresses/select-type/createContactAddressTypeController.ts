import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { CreateContactAddressParam, getAddressFormAndUrl } from '../common/utils'
import { AddressTypeSchema } from '../../../manage/addresses/address-type/addressTypeSchemas'

export default class CreateContactAddressTypeController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_SELECT_ADDRESS_TYPE_PAGE

  GET = async (req: Request<CreateContactAddressParam>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journey, addressForm, bounceBackUrl } = getAddressFormAndUrl(req)

    const navigation: Navigation = {
      backLink: bounceBackUrl,
    }
    const viewModel = {
      isNewContact: true,
      journey,
      contact: journey.names,
      addressType: res.locals?.formResponses?.['type'] ?? addressForm.addressType,
      typeOptions: await this.referenceDataService.getReferenceData(ReferenceCodeType.ADDRESS_TYPE, user),
      navigation,
    }
    res.render('pages/contacts/manage/contactMethods/address/addressType', viewModel)
  }

  POST = async (req: Request<CreateContactAddressParam, unknown, AddressTypeSchema>, res: Response): Promise<void> => {
    const { addressForm, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)
    addressForm.addressType = req.body.addressType
    res.redirect(bounceBackOrAddressUrl({ subPath: 'enter-address' }))
  }
}
