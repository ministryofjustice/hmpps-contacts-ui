import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../common/navigation'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

type PatchContactRequest = components['schemas']['PatchContactRequest']

export default class ManageInterpreterController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_INTERPRETER_PAGE

  GET = async (req: Request<PrisonerJourneyParams & { contactId: string }>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { user, journey } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    return res.render('pages/contacts/manage/contactDetails/manageInterpreter', {
      contact,
      navigation,
    })
  }

  POST = async (req: Request<{ contactId: string; prisonerNumber: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId } = req.params
    const request: PatchContactRequest = {
      interpreterRequired: req.body.interpreterRequired === 'YES',
      updatedBy: user.username,
    }

    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)

    res.redirect(journey.returnPoint.url)
  }
}
