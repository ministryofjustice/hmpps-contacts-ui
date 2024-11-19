import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import ContactDetails = contactsApiClientTypes.ContactDetails
import ContactEmailDetails = contactsApiClientTypes.ContactEmailDetails

export default class ManageContactDeleteEmailController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_DELETE_EMAIL_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactEmailId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { contactId, contactEmailId } = req.params
    const contactIdNumber = Number(contactId)
    const contactEmailIdNumber = Number(contactEmailId)
    const contact: ContactDetails = await this.contactsService.getContact(contactIdNumber, user)
    const email: ContactEmailDetails = contact.emailAddresses.find(
      (aEmail: ContactEmailDetails) => aEmail.contactEmailId === contactEmailIdNumber,
    )
    if (!email) {
      throw new Error(
        `Couldn't find email with id ${contactEmailId} for contact ${contactId}. URL probably entered manually.`,
      )
    }

    res.render('pages/contacts/manage/confirmDeleteEmail', { email })
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactEmailId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId, contactEmailId } = req.params
    const contactIdNumber = Number(contactId)
    const contactEmailIdNumber = Number(contactEmailId)

    await this.contactsService.deleteContactEmail(contactIdNumber, contactEmailIdNumber, user)
    res.redirect(journey.returnPoint.url)
  }
}
