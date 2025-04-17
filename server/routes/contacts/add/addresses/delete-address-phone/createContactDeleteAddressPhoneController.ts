import { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Navigation } from '../../../common/navigation'
import { CreateContactAddressParam, getAddressFormAndUrl } from '../common/utils'
import { getFormattedAddress } from '../../../manage/addresses/common/utils'
import ReferenceDataService from '../../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import logger from '../../../../../../logger'
import { ContactAddressPhoneDetails } from '../../../../../@types/contactsApiClient'

export default class CreateContactDeleteAddressPhoneController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_DELETE_ADDRESS_PHONE_PAGE

  GET = async (req: Request<CreateContactAddressParam & { phoneIdx: string }>, res: Response): Promise<void> => {
    const { addressIndex, phoneIdx } = req.params
    const { addressForm, bounceBackUrl } = getAddressFormAndUrl(req)

    const phone = addressForm.phoneNumbers?.[Number(phoneIdx) - 1]
    if (!phone) {
      logger.error(
        `Couldn't find phone at index ${phoneIdx} for an address ${addressIndex}. URL probably entered manually.`,
      )
      throw new NotFound()
    }
    const navigation: Navigation = {
      backLink: bounceBackUrl,
      cancelButton: bounceBackUrl,
    }
    res.render('pages/contacts/manage/contactMethods/address/phone/confirmDeleteAddressPhone', {
      isNewContact: true,
      phone: {
        ...phone,
        extNumber: phone.extension,
        phoneTypeDescription:
          phone.type &&
          (await this.referenceDataService.getReferenceDescriptionForCode(
            ReferenceCodeType.PHONE_TYPE,
            phone.type,
            res.locals.user,
          )),
      },
      navigation,
      formattedAddress: await getFormattedAddress(this.referenceDataService, addressForm, res.locals.user),
    })
  }

  POST = async (req: Request<CreateContactAddressParam & { phoneIdx: string }>, res: Response): Promise<void> => {
    const { addressIndex, phoneIdx } = req.params
    const { addressForm, bounceBackUrl } = getAddressFormAndUrl(req)

    const phone: ContactAddressPhoneDetails = addressForm.phoneNumbers?.[Number(phoneIdx) - 1]
    if (!phone) {
      logger.error(
        `Couldn't find phone at index ${phoneIdx} for an address ${addressIndex}. URL probably entered manually.`,
      )
      throw new NotFound()
    }

    addressForm.phoneNumbers = addressForm.phoneNumbers?.filter(itm => itm !== phone)
    if (addressForm.phoneNumbers?.length === 0) delete addressForm.phoneNumbers
    res.redirect(bounceBackUrl)
  }
}
