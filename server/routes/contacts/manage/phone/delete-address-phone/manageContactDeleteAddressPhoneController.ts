import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import ContactPhoneDetails = contactsApiClientTypes.ContactPhoneDetails
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../../common/navigation'
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

export default class ManageContactDeleteAddressPhoneController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.DELETE_ADDRESS_PHONE_PAGE

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      contactAddressId: string
      contactAddressPhoneId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { user, journey } = res.locals
    const { contactId, contactAddressId, contactAddressPhoneId } = req.params
    const contactIdNumber = Number(contactId)
    const contact: ContactDetails = await this.contactsService.getContact(contactIdNumber, user)
    const address = contact.addresses.find(
      (item: ContactAddressDetails) => item.contactAddressId === Number(contactAddressId),
    )
    const phone: ContactPhoneDetails = address.phoneNumbers.find(
      (aPhone: ContactPhoneDetails) => aPhone.contactPhoneId === Number(contactAddressPhoneId),
    )
    if (!phone) {
      throw new Error(
        `Couldn't find phone with id ${contactAddressPhoneId} for contact ${contactId} and address ${contactAddressId}. URL probably entered manually.`,
      )
    }
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    res.render('pages/contacts/manage/confirmDeleteAddressPhone', { phone, navigation, address })
  }

  POST = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      contactAddressId: string
      contactAddressPhoneId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId, contactAddressId, contactAddressPhoneId } = req.params
    const contactIdNumber = Number(contactId)
    const contactAddressIdNumber = Number(contactAddressId)
    const contactPhoneIdNumber = Number(contactAddressPhoneId)

    await this.contactsService.deleteContactAddressPhone(
      contactIdNumber,
      contactAddressIdNumber,
      contactPhoneIdNumber,
      user,
    )
    res.redirect(journey.returnPoint.url)
  }
}
