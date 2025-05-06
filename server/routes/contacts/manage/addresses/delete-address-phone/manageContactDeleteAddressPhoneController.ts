import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { getUpdateAddressDetails } from '../common/utils'
import { ContactAddressPhoneDetails } from '../../../../../@types/contactsApiClient'
import Permission from '../../../../../enumeration/permission'

export default class ManageContactDeleteAddressPhoneController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.DELETE_ADDRESS_PHONE_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      contactAddressId: string
      contactAddressPhoneId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId, contactAddressPhoneId } = req.params
    const { address, formattedAddress } = await getUpdateAddressDetails(this.contactsService, req, res)
    const phone = address.phoneNumbers.find(
      (aPhone: ContactAddressPhoneDetails) => aPhone.contactAddressPhoneId === Number(contactAddressPhoneId),
    )
    if (!phone) {
      throw new Error(
        `Couldn't find phone with id ${contactAddressPhoneId} for contact ${contactId} and address ${contactAddressId}. URL probably entered manually.`,
      )
    }
    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    res.render('pages/contacts/manage/contactMethods/address/phone/confirmDeleteAddressPhone', {
      phone,
      navigation,
      formattedAddress,
    })
  }

  POST = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      contactAddressId: string
      contactAddressPhoneId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId, contactAddressPhoneId } = req.params
    const contactIdNumber = Number(contactId)
    const contactAddressIdNumber = Number(contactAddressId)
    const contactPhoneIdNumber = Number(contactAddressPhoneId)

    await this.contactsService.deleteContactAddressPhone(
      contactIdNumber,
      contactAddressIdNumber,
      contactPhoneIdNumber,
      user,
      req.id,
    )
    await this.contactsService
      .getContactName(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
