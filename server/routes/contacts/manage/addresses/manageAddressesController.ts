import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import { SelectRelationshipSchema } from '../../common/relationship/selectRelationshipSchemas'
import { Navigation } from '../../add/addContactFlowControl'
import ContactDetails = contactsApiClientTypes.ContactDetails
import ContactNames = journeys.ContactNames

export default class ManageAddressesController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_MANAGE_ADDRESSES_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { contactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)

    const { journey } = res.locals
    const names: ContactNames = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }

    const navigation: Navigation = { backLink: journey.returnPoint.url }
    const viewModel = {
      journey: { ...journey, names },
      navigation,
      contact,
    }
    res.render('pages/contacts/common/manageAddresses', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
      },
      unknown,
      SelectRelationshipSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { journey } = res.locals
    res.redirect(journey.returnPoint.url)
  }
}
