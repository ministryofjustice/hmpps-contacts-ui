import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { PhoneNumberSchemaType } from '../phoneSchemas'
import { ContactsService } from '../../../../../services'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../../common/navigation'
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

export default class ManageContactAddAddressPhoneController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.ADD_ADDRESS_PHONE_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactAddressId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user, journey } = res.locals
    const { contactId, contactAddressId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const address = contact.addresses.find(
      (item: ContactAddressDetails) => item.contactAddressId === Number(contactAddressId),
    )
    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.PHONE_TYPE, user)
      .then(val => this.getSelectedOptions(val, res.locals?.formResponses?.['type']))
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    const viewModel = {
      typeOptions,
      phoneNumber: res.locals?.formResponses?.['phoneNumber'],
      type: res.locals?.formResponses?.['type'],
      extension: res.locals?.formResponses?.['extension'],
      contact,
      address,
      navigation,
    }
    res.render('pages/contacts/manage/addEditAddressPhone', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; contactAddressId: string },
      unknown,
      PhoneNumberSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId, contactAddressId } = req.params
    const { phoneNumber, type, extension } = req.body
    await this.contactsService.createContactAddressPhone(
      Number(contactId),
      Number(contactAddressId),
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
