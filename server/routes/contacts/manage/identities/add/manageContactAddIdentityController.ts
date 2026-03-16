import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { IDENTITY_NUMBER_DUPLICATE, IdentitySchemaType } from '../IdentitySchemas'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { ContactDetails } from '../../../../../@types/contactsApiClient'
import Permission from '../../../../../enumeration/permission'
import { SanitisedError } from '../../../../../sanitisedError'

export default class ManageContactAddIdentityController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_ADD_IDENTITY_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

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
      identityValue: res.locals?.formResponses?.['identityValue'],
      identityType: res.locals?.formResponses?.['identityType'],
      issuingAuthority: res.locals?.formResponses?.['issuingAuthority'],
      contact,
      navigation,
    }
    res.render('pages/contacts/manage/addIdentity', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
      },
      unknown,
      IdentitySchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { identityType, identityValue, issuingAuthority } = req.body
    const { user } = res.locals

    try {
      const [, contactName] = await Promise.all([
        this.contactsService.createContactIdentity(
          parseInt(contactId, 10),
          user,
          { identityType, identityValue, issuingAuthority },
          req.id,
        ),
        this.contactsService.getContactName(Number(contactId), user),
      ])

      req.flash(
        FLASH_KEY__SUCCESS_BANNER,
        `You’ve updated the identity documentation for ${formatNameFirstNameFirst(contactName)}.`,
      )

      return res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
    } catch (error) {
      // Catch duplicate identity document error
      if ((error as SanitisedError)?.status === 409) {
        req.flash('formResponses', JSON.stringify(req.body))
        req.flash(
          'validationErrors',
          JSON.stringify({
            identityValue: [IDENTITY_NUMBER_DUPLICATE],
          }),
        )
        return res.redirect(req.originalUrl)
      }

      throw error
    }
  }
}
