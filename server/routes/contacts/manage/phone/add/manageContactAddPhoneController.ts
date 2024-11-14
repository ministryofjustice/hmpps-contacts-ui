import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { PhoneNumberSchemaType } from '../phoneSchemas'
import { ContactsService } from '../../../../../services'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactDetails = contactsApiClientTypes.ContactDetails
import StandaloneManageContactJourney = journeys.StandaloneManageContactJourney

export default class ManageContactAddPhoneController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_ADD_PHONE_PAGE

  GET = async (req: Request<{ prisonerNumber: string; contactId: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { contactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.PHONE_TYPE, user)
      .then(val => this.getSelectedOptions(val, res.locals?.formResponses?.type))
    const viewModel = {
      typeOptions,
      phoneNumber: res.locals?.formResponses?.phoneNumber,
      type: res.locals?.formResponses?.type,
      extension: res.locals?.formResponses?.extension,
      contact,
    }
    res.render('pages/contacts/manage/addEditPhone', viewModel)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string }, unknown, PhoneNumberSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { journey } = res.locals
    const { contactId } = req.params
    const { phoneNumber, type, extension } = req.body
    await this.contactsService.createContactPhone(parseInt(contactId, 10), user, type, phoneNumber, extension)
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
