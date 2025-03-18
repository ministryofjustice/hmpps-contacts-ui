import { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Navigation } from '../../../common/navigation'
import ContactAddressPhoneDetails = contactsApiClientTypes.ContactAddressPhoneDetails
import { CreateContactAddressParam, getAddressFormAndUrl } from '../common/utils'
import { getFormattedAddress } from '../../../manage/addresses/common/utils'
import ReferenceDataService from '../../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import logger from '../../../../../../logger'

export default class ContactDeleteAddressPhoneController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.DELETE_ADDRESS_PHONE_PAGE

  GET = async (req: Request<CreateContactAddressParam & { phoneIdx: string }>, res: Response): Promise<void> => {
    const { addressIdx, phoneIdx } = req.params
    const { addressForm, bounceBackUrl } = getAddressFormAndUrl(req)

    const phone = addressForm.phoneNumbers?.[Number(phoneIdx) - 1]
    if (!phone) {
      logger.error(
        `Couldn't find phone at index ${phoneIdx} for and address ${addressIdx}. URL probably entered manually.`,
      )
      throw new NotFound()
    }
    const navigation: Navigation = {
      backLink: bounceBackUrl,
      cancelButton: bounceBackUrl,
    }
    res.render('pages/contacts/manage/contactMethods/address/phone/confirmDeleteAddressPhone', {
      caption: 'Add a contact and link to a prisoner',
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
    const { addressIdx, phoneIdx } = req.params
    const { addressForm, bounceBackUrl } = getAddressFormAndUrl(req)

    const phone: ContactAddressPhoneDetails = addressForm.phoneNumbers?.[Number(phoneIdx) - 1]
    if (!phone) {
      logger.error(
        `Couldn't find phone at index ${phoneIdx} for and address ${addressIdx}. URL probably entered manually.`,
      )
      throw new NotFound()
    }

    addressForm.phoneNumbers = addressForm.phoneNumbers?.filter(itm => itm !== phone)
    if (addressForm.phoneNumbers?.length === 0) delete addressForm.phoneNumbers
    res.redirect(bounceBackUrl)
  }
}
