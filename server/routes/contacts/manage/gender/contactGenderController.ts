import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../common/navigation'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import Urls from '../../../urls'
import { ContactGenderSchemaType } from './contactGenderSchema'

type PatchContactRequest = components['schemas']['PatchContactRequest']

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
      caption: 'Edit contact details',
      isOptional: false,
      continueButtonLabel: 'Confirm and save',
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
      updatedBy: user.username,
    }

    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)
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
