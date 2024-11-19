import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import ContactNames = journeys.ContactNames
import ContactDetails = contactsApiClientTypes.ContactDetails

export default class SuccessfullyAddedContactController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.SUCCESSFULLY_ADDED_CONTACT_PAGE

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      mode: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { contactId, prisonerContactId, mode } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)

    const names: ContactNames = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    let successMessage
    switch (mode) {
      case 'EXISTING':
        successMessage = 'Existing contact linked to prisoner'
        break
      case 'NEW':
        successMessage = 'New contact added and linked to prisoner'
        break
      default:
        break
    }
    const view = {
      journey: { names },
      successMessage,
      contactId,
      prisonerContactId,
      navigation: {
        breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'],
      },
    }
    res.render('pages/contacts/common/success', view)
  }
}
