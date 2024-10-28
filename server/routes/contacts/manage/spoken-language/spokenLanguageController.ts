import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import Contact = contactsApiClientTypes.Contact

type Language = components['schemas']['Language']
export default class SpokenLanguageController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_SPOKEN_LANGUAGE_PAGE

  GET = async (req: Request<{ journeyId: string; contactId?: string }>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]
    const { contactId } = req.params
    const { prisonerDetails, user } = res.locals

    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const language: Language = await this.contactsService.getLanguageReference(user)

    return res.render('pages/contacts/manage/add/selectSpokenLanguage', {
      journey,
      contact,
      language,
      prisonerDetails,
    })
  }

  POST = async (
    req: Request<{ journeyId: string; contactId: string; prisonerNumber: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, contactId, prisonerNumber } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]
    journey.languageCode = req.body.languageCode

    res.redirect(`/contacts/manage/${prisonerNumber}/${contactId}/${journeyId}`)
  }
}
