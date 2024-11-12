import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import ContactIdentityDetails = contactsApiClientTypes.ContactIdentityDetails
import ContactDetails = contactsApiClientTypes.ContactDetails

export default class ManageContactDeleteIdentityController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_DELETE_IDENTITY_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactIdentityId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, contactIdentityId } = req.params
    const contactIdNumber = parseInt(contactId, 10)
    const contactIdentityNumber = parseInt(contactIdentityId, 10)
    const contact: ContactDetails = await this.contactsService.getContact(contactIdNumber, user)
    const identityNumber: ContactIdentityDetails = contact.identities.find(
      (aIdentityNumber: ContactIdentityDetails) => aIdentityNumber.contactIdentityId === contactIdentityNumber,
    )
    if (!identityNumber) {
      throw new Error(
        `Couldn't find identity number with id ${contactIdentityId} for contact ${contactId}. URL probably entered manually.`,
      )
    }

    await this.contactsService.deleteContactIdentity(contactIdNumber, contactIdentityNumber, user)
    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)
  }
}
