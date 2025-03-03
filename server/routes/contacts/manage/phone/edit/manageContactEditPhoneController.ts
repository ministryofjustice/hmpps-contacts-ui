import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { PhoneNumberSchemaType } from '../phoneSchemas'
import { ContactsService } from '../../../../../services'
import ContactPhoneDetails = contactsApiClientTypes.ContactPhoneDetails
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'

export default class ManageContactEditPhoneController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_PHONE_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactPhoneId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactPhoneId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const phone: ContactPhoneDetails = contact.phoneNumbers.find(
      (aPhone: ContactPhoneDetails) => aPhone.contactPhoneId === parseInt(contactPhoneId, 10),
    )
    if (!phone) {
      throw new Error(
        `Couldn't find phone with id ${contactPhoneId} for contact ${contactId}. URL probably entered manually.`,
      )
    }
    const typeOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user)
    const navigation: Navigation = { backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId) }
    const viewModel = {
      typeOptions,
      phoneNumber: res.locals?.formResponses?.['phoneNumber'] ?? phone.phoneNumber,
      type: res.locals?.formResponses?.['type'] ?? phone.phoneType,
      extension: res.locals?.formResponses?.['extension'] ?? phone.extNumber,
      contact,
      navigation,
    }
    res.render('pages/contacts/manage/contactMethods/addEditPhone', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string; contactPhoneId: string },
      unknown,
      PhoneNumberSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactPhoneId } = req.params
    const { phoneNumber, type, extension } = req.body
    await this.contactsService.updateContactPhone(
      parseInt(contactId, 10),
      parseInt(contactPhoneId, 10),
      user,
      type,
      phoneNumber,
      extension,
    )
    await this.contactsService
      .getContact(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
