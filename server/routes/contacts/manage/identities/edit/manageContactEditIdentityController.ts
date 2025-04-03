import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { IdentitySchemaType } from '../IdentitySchemas'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import ContactIdentityDetails = contactsApiClientTypes.ContactIdentityDetails
import ContactDetails = contactsApiClientTypes.ContactDetails

export default class ManageContactEditIdentityController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_EDIT_IDENTITY_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactIdentityId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactIdentityId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const identity: ContactIdentityDetails = contact.identities.find(
      (aIdentityNumber: ContactIdentityDetails) =>
        aIdentityNumber.contactIdentityId === parseInt(contactIdentityId, 10),
    )
    if (!identity) {
      throw new Error(
        `Couldn't find Identity Number with id ${contactIdentityId} for contact ${contactId}. URL probably entered manually.`,
      )
    }
    const typeOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.ID_TYPE, user)
    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      typeOptions,
      identityValue: res.locals?.formResponses?.['identityValue'] ?? identity.identityValue,
      identityType: res.locals?.formResponses?.['identityType'] ?? identity.identityType,
      issuingAuthority: res.locals?.formResponses?.['issuingAuthority'] ?? identity.issuingAuthority,
      contact,
      navigation,
    }
    res.render('pages/contacts/manage/editIdentity', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string; contactIdentityId: string },
      unknown,
      IdentitySchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactIdentityId } = req.params
    const { identityType, identityValue, issuingAuthority } = req.body
    await this.contactsService
      .updateContactIdentity(
        parseInt(contactId, 10),
        parseInt(contactIdentityId, 10),
        user,
        req.id,
        identityType,
        identityValue,
        issuingAuthority,
      )
      .then(_ => this.contactsService.getContactName(Number(contactId), user))
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the identity documentation for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
