import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import ContactIdentityDetails = contactsApiClientTypes.ContactIdentityDetails
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../../common/navigation'

export default class ManageContactDeleteIdentityController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_DELETE_IDENTITY_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactIdentityId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user, journey } = res.locals
    const { contactId, contactIdentityId } = req.params
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
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    res.render('pages/contacts/manage/confirmDeleteIdentity', { identityNumber, navigation })
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactIdentityId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId, contactIdentityId } = req.params
    const contactIdNumber = Number(contactId)
    const contactIdentityNumber = Number(contactIdentityId)

    await this.contactsService.deleteContactIdentity(contactIdNumber, contactIdentityNumber, user)
    res.redirect(journey.returnPoint.url)
  }
}
