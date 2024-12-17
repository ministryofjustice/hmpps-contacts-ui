import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { PhoneNumberSchemaType } from '../phoneSchemas'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactDetails = contactsApiClientTypes.ContactDetails
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import ContactAddressPhoneDetails = contactsApiClientTypes.ContactAddressPhoneDetails

export default class ManageContactEditAddressPhoneController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.EDIT_ADDRESS_PHONE_PAGE

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      contactAddressId: string
      contactAddressPhoneId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { user, journey } = res.locals
    const { contactId, contactAddressId, contactAddressPhoneId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const address = contact.addresses.find(
      (item: ContactAddressDetails) => item.contactAddressId === Number(contactAddressId),
    )
    const phone: ContactAddressPhoneDetails = address.phoneNumbers.find(
      (aPhone: ContactAddressPhoneDetails) => aPhone.contactAddressPhoneId === Number(contactAddressPhoneId),
    )
    if (!phone) {
      throw new Error(
        `Couldn't find phone with id ${contactAddressPhoneId} for contact ${contactId} and address ${contactAddressId}. URL probably entered manually.`,
      )
    }
    const currentType = res.locals?.formResponses?.type ?? phone.phoneType
    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.PHONE_TYPE, user)
      .then(val => this.getSelectedOptions(val, currentType))
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    const viewModel = {
      typeOptions,
      phoneNumber: res.locals?.formResponses?.phoneNumber ?? phone.phoneNumber,
      type: currentType,
      extension: res.locals?.formResponses?.extension ?? phone.extNumber,
      contact,
      navigation,
      address,
    }
    res.render('pages/contacts/manage/addEditAddressPhone', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        contactAddressId: string
        contactAddressPhoneId: string
      },
      unknown,
      PhoneNumberSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId, contactAddressId, contactAddressPhoneId } = req.params
    const { phoneNumber, type, extension } = req.body
    await this.contactsService.updateContactAddressPhone(
      Number(contactId),
      Number(contactAddressId),
      Number(contactAddressPhoneId),
      user,
      type,
      phoneNumber,
      extension,
    )
    res.redirect(journey.returnPoint.url)
  }

  private getSelectedOptions(
    options: ReferenceCode[],
    selectedType?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options.map((referenceCode: ReferenceCode) => {
      return {
        text: referenceCode.description,
        value: referenceCode.code,
        selected: referenceCode.code === selectedType,
      }
    })
    return [{ text: '', value: '' }, ...mappedOptions]
  }
}
