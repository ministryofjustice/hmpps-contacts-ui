import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import ContactDetails = contactsApiClientTypes.ContactDetails
import sortContactAddresses from '../../../../utils/sortAddress'
import { getAddressTitle, isExpiredAddress } from '../../../../utils/addressUtils'
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

export default class EditContactMethodsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.EDIT_CONTACT_METHODS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId?: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user, journey } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    let returnUrlWithAnchor = journey.returnPoint.url
    if (journey.returnPoint.anchor) {
      returnUrlWithAnchor += `#${journey.returnPoint.anchor}`
    }
    const navigation: Navigation = {
      backLink: returnUrlWithAnchor,
      cancelButton: returnUrlWithAnchor,
    }

    const addresses = sortContactAddresses(contact.addresses).map((address: ContactAddressDetails) => {
      const expired = isExpiredAddress(address.endDate)
      return {
        ...address,
        isExpired: expired,
        addressTitle: getAddressTitle(address, expired),
      }
    })

    return res.render('pages/contacts/manage/contactDetails/details/editContactMethods', {
      contact,
      addresses,
      prisonerNumber,
      contactId,
      prisonerContactId,
      navigation,
      returnPoint: journey.returnPoint,
    })
  }
}
