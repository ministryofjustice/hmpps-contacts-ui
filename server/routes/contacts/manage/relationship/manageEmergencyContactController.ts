import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest
import ContactDetails = contactsApiClientTypes.ContactDetails

export default class ManageEmergencyContactController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_EMERGENCY_STATUS_PAGE

  GET = async (req: Request<{ contactId?: string; prisonerContactId?: string }>, res: Response): Promise<void> => {
    const { contactId, prisonerContactId } = req.params
    const { prisonerDetails, user } = res.locals

    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const relationship = await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)

    return res.render('pages/contacts/manage/contactDetails/manageEmergencyContactStatus', {
      contact,
      prisonerContactId,
      relationship,
      prisonerDetails,
    })
  }

  POST = async (
    req: Request<{ contactId: string; prisonerNumber: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { contactId, prisonerNumber, prisonerContactId } = req.params
    const request: UpdateRelationshipRequest = {
      isEmergencyContact: req.body.emergencyContactStatus === 'YES',
      updatedBy: user.username,
    }

    await this.contactsService.updateContactRelationshipById(
      parseInt(contactId, 10),
      Number(prisonerContactId),
      request,
      user,
    )

    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)
  }
}
