import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import ContactDetails = contactsApiClientTypes.ContactDetails
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import ContactAddressPhoneDetails = contactsApiClientTypes.ContactAddressPhoneDetails
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'

export default class ManageContactDeleteAddressPhoneController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.DELETE_ADDRESS_PHONE_PAGE

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
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId, contactAddressPhoneId } = req.params
    const contactIdNumber = Number(contactId)
    const contact: ContactDetails = await this.contactsService.getContact(contactIdNumber, user)
    const address = contact.addresses.find(
      (item: ContactAddressDetails) => item.contactAddressId === Number(contactAddressId),
    )
    const phone: ContactAddressPhoneDetails = address.phoneNumbers.find(
      (aPhone: ContactAddressPhoneDetails) => aPhone.contactAddressPhoneId === Number(contactAddressPhoneId),
    )
    if (!phone) {
      throw new Error(
        `Couldn't find phone with id ${contactAddressPhoneId} for contact ${contactId} and address ${contactAddressId}. URL probably entered manually.`,
      )
    }
    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId, 'contact-methods'),
    }
    res.render('pages/contacts/manage/contactMethods/confirmDeleteAddressPhone', { phone, navigation, address })
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
    )
    await this.contactsService
      .getContact(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
