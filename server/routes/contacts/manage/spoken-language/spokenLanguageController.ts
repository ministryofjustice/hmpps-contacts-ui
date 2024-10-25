import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import Contact = contactsApiClientTypes.Contact
import logger from '../../../../../logger'
import { components } from '../../../../@types/contactsApi'

type Language = components['schemas']['Language']
export default class SpokenLanguageController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_SPOKEN_LANGUAGE_PAGE

  GET = async (req: Request<{ contactId?: string }, unknown, unknown>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { prisonerDetails, user } = res.locals
    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const language: Language = await this.contactsService.getLanguageReference(user)

    logger.info(JSON.stringify(contact))
    logger.info(JSON.stringify(language))
    return res.render('pages/contacts/manage/add/selectSpokenLanguage', {
      contact,
      language,
      prisonerDetails,
    })
  }
}
