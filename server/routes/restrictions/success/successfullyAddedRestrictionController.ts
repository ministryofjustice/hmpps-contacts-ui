import { Request, Response } from 'express'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import { ContactsService } from '../../../services'
import ContactNames = journeys.ContactNames
import ContactDetails = contactsApiClientTypes.ContactDetails
import RestrictionClass = journeys.RestrictionClass

export default class SuccessfullyAddedRestrictionController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.SUCCESSFULLY_ADDED_RESTRICTION_PAGE

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
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)

    const names: ContactNames = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    let successMessage
    switch (restrictionClass) {
      case 'CONTACT_GLOBAL':
        successMessage = 'New global restriction recorded'
        break
      case 'PRISONER_CONTACT':
        successMessage = 'New prisoner-contact restriction recorded'
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
      caption: 'Manage contact restrictions',
    }
    res.render('pages/contacts/common/success', view)
  }
}
