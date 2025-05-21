import { Request, Response } from 'express'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import { ContactsService } from '../../../services'
import { ContactNames, RestrictionClass } from '../../../@types/journeys'
import { ContactNameDetails } from '../../../@types/contactsApiClient'
import Permission from '../../../enumeration/permission'

export default class SuccessfullyAddedRestrictionController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.SUCCESSFULLY_ADDED_RESTRICTION_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_RESTRICTIONS

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      restrictionClass: RestrictionClass
    }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { contactId, prisonerContactId, restrictionClass } = req.params
    const contact: ContactNameDetails = await this.contactsService.getContactName(Number(contactId), user)

    const names: ContactNames = {
      title: contact.titleDescription,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }

    const view = {
      journey: { names },
      restrictionClass,
      contactId,
      prisonerContactId,
      navigation: {
        breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'],
      },
    }
    res.render('pages/contacts/restrictions/success', view)
  }
}
