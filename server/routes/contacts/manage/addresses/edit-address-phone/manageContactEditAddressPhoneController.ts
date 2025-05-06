import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { PhoneNumberSchemaType } from '../../phone/phoneSchemas'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'
import { getUpdateAddressDetails } from '../common/utils'
import { ContactAddressPhoneDetails } from '../../../../../@types/contactsApiClient'
import Permission from '../../../../../enumeration/permission'

export default class ManageContactEditAddressPhoneController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.EDIT_ADDRESS_PHONE_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      contactAddressId: string
      contactAddressPhoneId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId, contactAddressPhoneId } = req.params
    const { address, formattedAddress } = await getUpdateAddressDetails(this.contactsService, req, res)
    const phone = address.phoneNumbers.find(
      (aPhone: ContactAddressPhoneDetails) => aPhone.contactAddressPhoneId === Number(contactAddressPhoneId),
    )
    if (!phone) {
      throw new Error(
        `Couldn't find phone with id ${contactAddressPhoneId} for contact ${contactId} and address ${contactAddressId}. URL probably entered manually.`,
      )
    }
    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      typeOptions: await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user),
      phoneNumber: res.locals?.formResponses?.['phoneNumber'] ?? phone.phoneNumber,
      type: res.locals?.formResponses?.['type'] ?? phone.phoneType,
      extension: res.locals?.formResponses?.['extension'] ?? phone.extNumber,
      formattedAddress,
      navigation,
      address,
    }
    res.render('pages/contacts/manage/contactMethods/address/phone/editAddressPhone', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        contactAddressId: string
        contactAddressPhoneId: string
      },
      unknown,
      PhoneNumberSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId, contactAddressPhoneId } = req.params
    const { phoneNumber, type, extension } = req.body
    await this.contactsService.updateContactAddressPhone(
      Number(contactId),
      Number(contactAddressId),
      Number(contactAddressPhoneId),
      user,
      req.id,
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
