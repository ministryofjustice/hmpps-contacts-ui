import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { IdentitySchemaType } from '../IdentitySchemas'
import { ContactsService } from '../../../../../services'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactDetails = contactsApiClientTypes.ContactDetails

export default class ManageContactAddIdentityController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_ADD_IDENTITY_PAGE

  GET = async (req: Request<{ prisonerNumber: string; contactId: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { contactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.ID_TYPE, user)
      .then(val => this.getSelectedOptions(val, res.locals?.formResponses?.type))
    const viewModel = {
      typeOptions,
      identity: res.locals?.formResponses?.identity,
      type: res.locals?.formResponses?.type,
      issuingAuthority: res.locals?.formResponses?.issuingAuthority,
      contact,
    }
    res.render('pages/contacts/manage/addEditIdentity', viewModel)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string }, unknown, IdentitySchemaType>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId } = req.params
    const { identity, type, issuingAuthority } = req.body
    await this.contactsService.createContactIdentity(parseInt(contactId, 10), user, type, identity, issuingAuthority)
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
