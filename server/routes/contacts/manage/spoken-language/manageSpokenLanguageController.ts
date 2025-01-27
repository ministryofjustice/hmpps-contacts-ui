import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import { Navigation } from '../../common/navigation'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ContactDetails = contactsApiClientTypes.ContactDetails
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

type PatchContactRequest = components['schemas']['PatchContactRequest']
export default class ManageSpokenLanguageController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_SPOKEN_LANGUAGE_PAGE

  GET = async (req: Request<PrisonerJourneyParams & { contactId: string }>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { user, journey } = res.locals

    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const spokenLanguages: ReferenceCode[] = await this.referenceDataService.getReferenceData(
      ReferenceCodeType.LANGUAGE,
      user,
    )

    const navigation: Navigation = { backLink: journey.returnPoint.url }
    return res.render('pages/contacts/manage/contactDetails/manageSpokenLanguage', {
      contact,
      spokenLanguages,
      navigation,
    })
  }

  POST = async (req: Request<{ contactId: string; prisonerNumber: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId } = req.params
    const request: PatchContactRequest = {
      languageCode: req.body.languageCode !== '' ? req.body.languageCode : null,
      updatedBy: user.username,
    }
    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)

    res.redirect(journey.returnPoint.url)
  }
}
