import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { IdentitySchemaType } from '../IdentitySchemas'
import { ContactsService } from '../../../../../services'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactIdentityDetails = contactsApiClientTypes.ContactIdentityDetails
import GetContactResponse = contactsApiClientTypes.GetContactResponse

export default class ManageContactEditIdentityController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_IDENTITY_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactIdentityId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { contactId, contactIdentityId } = req.params
    const contact: GetContactResponse = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const identity: ContactIdentityDetails = contact.identities.find(
      (aIdentityNumber: ContactIdentityDetails) =>
        aIdentityNumber.contactIdentityId === parseInt(contactIdentityId, 10),
    )
    if (!identity) {
      throw new Error(
        `Couldn't find Identity Number with id ${contactIdentityId} for contact ${contactId}. URL probably entered manually.`,
      )
    }
    const currentType = res.locals?.formResponses?.type ?? identity.identityType
    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.ID_TYPE, user)
      .then(val => this.getSelectedOptions(val, currentType))
    const viewModel = {
      typeOptions,
      identity: res.locals?.formResponses?.identity ?? identity.identityValue,
      type: currentType,
      issuingAuthority: res.locals?.formResponses?.issuingAuthority ?? identity.issuingAuthority,
      contact,
    }
    res.render('pages/contacts/manage/addEditIdentity', viewModel)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string; contactIdentityId: string }, unknown, IdentitySchemaType>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, contactIdentityId } = req.params
    const { identity, type, issuingAuthority } = req.body
    await this.contactsService.updateContactIdentity(
      parseInt(contactId, 10),
      parseInt(contactIdentityId, 10),
      user,
      type,
      identity,
      issuingAuthority,
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
