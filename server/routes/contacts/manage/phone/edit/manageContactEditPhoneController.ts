import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { PhoneNumberSchemaType } from '../phoneSchemas'
import { ContactsService } from '../../../../../services'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactPhoneDetails = contactsApiClientTypes.ContactPhoneDetails
import GetContactResponse = contactsApiClientTypes.GetContactResponse

export default class ManageContactEditPhoneController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_PHONE_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactPhoneId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { contactId, contactPhoneId } = req.params
    const contact: GetContactResponse = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const phone: ContactPhoneDetails = contact.phoneNumbers.find(
      (aPhone: ContactPhoneDetails) => aPhone.contactPhoneId === parseInt(contactPhoneId, 10),
    )
    if (!phone) {
      throw new Error(
        `Couldn't find phone with id ${contactPhoneId} for contact ${contactId}. URL probably entered manually.`,
      )
    }
    const currentType = res.locals?.formResponses?.type ?? phone.phoneType
    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.PHONE_TYPE, user)
      .then(val => this.getSelectedOptions(val, currentType))
    const viewModel = {
      typeOptions,
      phoneNumber: res.locals?.formResponses?.phoneNumber ?? phone.phoneNumber,
      type: currentType,
      extension: res.locals?.formResponses?.extension ?? phone.extNumber,
      contact,
    }
    res.render('pages/contacts/manage/addEditPhone', viewModel)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactPhoneId: string }, unknown, PhoneNumberSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, contactPhoneId } = req.params
    const { phoneNumber, type, extension } = req.body
    await this.contactsService.updateContactPhone(
      parseInt(contactId, 10),
      parseInt(contactPhoneId, 10),
      user,
      type,
      phoneNumber,
      extension,
    )
    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)
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