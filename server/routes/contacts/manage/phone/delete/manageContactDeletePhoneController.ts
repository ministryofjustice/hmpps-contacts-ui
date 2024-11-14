import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import ContactPhoneDetails = contactsApiClientTypes.ContactPhoneDetails
import ContactDetails = contactsApiClientTypes.ContactDetails
import StandaloneManageContactJourney = journeys.StandaloneManageContactJourney

export default class ManageContactDeletePhoneController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_DELETE_PHONE_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactPhoneId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId, contactPhoneId } = req.params
    const contactIdNumber = parseInt(contactId, 10)
    const contactPhoneIdNumber = parseInt(contactPhoneId, 10)
    const contact: ContactDetails = await this.contactsService.getContact(contactIdNumber, user)
    const phone: ContactPhoneDetails = contact.phoneNumbers.find(
      (aPhone: ContactPhoneDetails) => aPhone.contactPhoneId === contactPhoneIdNumber,
    )
    if (!phone) {
      throw new Error(
        `Couldn't find phone with id ${contactPhoneId} for contact ${contactId}. URL probably entered manually.`,
      )
    }

    await this.contactsService.deleteContactPhone(contactIdNumber, contactPhoneIdNumber, user)
    res.redirect(journey.returnPoint.url)
  }
}
