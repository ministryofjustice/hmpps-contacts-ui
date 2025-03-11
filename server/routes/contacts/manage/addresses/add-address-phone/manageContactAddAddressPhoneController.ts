import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { PhoneNumberSchemaType } from '../../phone/phoneSchemas'
import { ContactsService } from '../../../../../services'
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../../common/navigation'
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'
import { getUpdateAddressDetails } from '../common/utils'

export default class ManageContactAddAddressPhoneController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.ADD_ADDRESS_PHONE_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactAddressId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { formattedAddress } = await getUpdateAddressDetails(this.contactsService, req, res)
    const typeOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user)
    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId, 'contact-methods'),
    }
    const viewModel = {
      isEdit: true,
      continueButtonLabel: 'Confirm and save',
      navigation,
      typeOptions,
      formattedAddress,
      phones: res.locals?.formResponses?.['phones'] ?? [{ type: '', phoneNumber: '', extension: '' }],
    }
    res.render('pages/contacts/manage/contactMethods/address/phone/addAddressPhone', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string; contactAddressId: string },
      unknown,
      PhoneNumberSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId } = req.params
    const { phoneNumber, type, extension } = req.body
    await this.contactsService.createContactAddressPhone(
      Number(contactId),
      Number(contactAddressId),
      user,
      type,
      phoneNumber,
      extension,
    )
    await this.contactsService
      .getContactName(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
