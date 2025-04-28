import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { Navigation } from '../../common/navigation'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import Urls from '../../../urls'
import { ContactGenderSchemaType } from './contactGenderSchema'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import { ContactDetails, PatchContactRequest } from '../../../../@types/contactsApiClient'

export default class ManageGenderController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_GENDER_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)

    const genderOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.GENDER, user)
    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    return res.render('pages/contacts/manage/contactDetails/manageGender', {
      isNewContact: false,
      contact,
      gender: contact.genderCode,
      genderOptions,
      navigation,
    })
  }

  POST = async (
    req: Request<
      { contactId: string; prisonerNumber: string; prisonerContactId: string },
      unknown,
      ContactGenderSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const request: PatchContactRequest = {
      genderCode: req.body.gender,
    }

    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user, req.id)
    await this.contactsService
      .getContactName(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the personal information for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
