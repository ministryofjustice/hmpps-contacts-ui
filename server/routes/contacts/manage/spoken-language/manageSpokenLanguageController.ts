import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import Contact = contactsApiClientTypes.Contact

type PatchContactRequest = components['schemas']['PatchContactRequest']
type Language = components['schemas']['Language']
export default class ManageSpokenLanguageController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_SPOKEN_LANGUAGE_PAGE

  GET = async (req: Request<{ contactId?: string }>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { prisonerDetails, user } = res.locals

    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const language: Language = await this.contactsService.getLanguageReference(user)

    return res.render('pages/contacts/manage/contactDetails/manageSpokenLanguage', {
      contact,
      language,
      prisonerDetails,
    })
  }

  POST = async (req: Request<{ contactId: string; prisonerNumber: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId } = req.params
    const request: PatchContactRequest = {
      languageCode: req.body.languageCode !== '' ? req.body.languageCode : null,
      updatedBy: user.userId,
    }
    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)

    res.redirect(journey.returnPoint.url)
  }
}
