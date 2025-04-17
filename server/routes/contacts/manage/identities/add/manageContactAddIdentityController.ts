import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { IdentitiesSchemaType } from '../IdentitySchemas'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { ContactDetails } from '../../../../../@types/contactsApiClient'

export default class ManageContactAddIdentityController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_ADD_IDENTITY_PAGE

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const typeOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.ID_TYPE, user)
    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      caption: 'Edit identity documentation for a contact',
      isNewContact: false,
      continueButtonLabel: 'Confirm and save',
      typeOptions,
      identities: res.locals?.formResponses?.['identities'] ?? [this.blankItem()],
      contact,
      navigation,
    }
    res.render('pages/contacts/manage/addIdentities', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
      },
      unknown,
      IdentitiesSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { save, add, remove, identities } = req.body
    const { user } = res.locals
    if (typeof save !== 'undefined' && identities) {
      await this.contactsService
        .createContactIdentities(parseInt(contactId, 10), user, identities, req.id)
        .then(_ => this.contactsService.getContactName(Number(contactId), user))
        .then(response =>
          req.flash(
            FLASH_KEY__SUCCESS_BANNER,
            `You’ve updated the identity documentation for ${formatNameFirstNameFirst(response)}.`,
          ),
        )
      res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
    } else {
      if (typeof add !== 'undefined') {
        identities.push(this.blankItem())
      } else if (typeof remove !== 'undefined') {
        identities.splice(Number(remove), 1)
      }
      // Always redirect back to input even if we didn't find an action, which should be impossible but there is a small
      // possibility if JS is disabled after a page load or the user somehow removes all identities.
      req.flash('formResponses', JSON.stringify(req.body))
      res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/create`,
      )
    }
  }

  private blankItem = (): { identityType: string; identityValue: string; issuingAuthority?: string } => {
    return { identityType: '', identityValue: '', issuingAuthority: '' }
  }
}
