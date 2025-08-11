import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import { ContactNameDetails } from '../../../../@types/contactsApiClient'
import { ContactNames } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class SuccessfullyAddedContactController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.SUCCESSFULLY_ADDED_CONTACT_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

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
    const contact: ContactNameDetails = await this.contactsService.getContactName(Number(contactId), user)

    const names: ContactNames = {
      title: contact.titleDescription,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    const view = {
      names,
      mode,
      contactId,
      prisonerContactId,
      navigation: {
        breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'],
      },
    }
    res.render('pages/contacts/common/addedContactSuccessfully', view)
  }
}
