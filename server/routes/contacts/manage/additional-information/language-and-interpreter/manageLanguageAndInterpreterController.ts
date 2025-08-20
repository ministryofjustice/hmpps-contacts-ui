import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import ReferenceDataService from '../../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { ManageLanguageAndInterpreterSchemaType } from './manageLanguageAndInterpreterSchema'
import { ContactDetails, PatchContactRequest, ReferenceCode } from '../../../../../@types/contactsApiClient'
import Permission from '../../../../../enumeration/permission'

export default class ManageLanguageAndInterpreterController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_LANGUAGE_AND_INTERPRETER_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals

    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const spokenLanguages: ReferenceCode[] = await this.referenceDataService.getReferenceData(
      ReferenceCodeType.LANGUAGE,
      user,
    )

    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    return res.render('pages/contacts/manage/contactDetails/languageAndInterpreter', {
      isNewContact: false,
      contact,
      language: res.locals.formResponses?.['language'] ?? contact.languageCode,
      interpreterRequired:
        res.locals.formResponses?.['interpreterRequired'] ?? (contact.interpreterRequired ? 'YES' : 'NO'),
      spokenLanguages,
      navigation,
    })
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string },
      unknown,
      ManageLanguageAndInterpreterSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const request: PatchContactRequest = {
      languageCode: req.body.language,
      interpreterRequired: req.body.interpreterRequired === 'YES',
    }
    await this.contactsService.updateContactById(Number(contactId), request, user, req.id)
    await this.contactsService.getContactName(Number(contactId), user).then(response => {
      req.flash(
        FLASH_KEY__SUCCESS_BANNER,
        `You’ve updated the additional information for ${formatNameFirstNameFirst(response)}.`,
      )
    })
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
