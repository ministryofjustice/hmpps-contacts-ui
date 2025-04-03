import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { getUpdateAddressDetails } from '../common/utils'
import ContactsService from '../../../../../services/contactsService'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { AddressCommentsSchemaType } from './addressCommentsSchema'

export default class ChangeAddressCommentsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.ENTER_ADDRESS_COMMENTS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactAddressId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { contact, addressMetadata, formattedAddress } = await getUpdateAddressDetails(this.contactsService, req, res)

    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      isEdit: true,
      caption: 'Edit contact methods',
      continueButtonLabel: 'Confirm and save',
      contact,
      formattedAddress,
      navigation,
      comments: res.locals?.formResponses?.['comments'] ?? addressMetadata?.comments,
    }
    res.render('pages/contacts/manage/contactMethods/address/comments', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        contactAddressId: string
      },
      unknown,
      AddressCommentsSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId } = req.params
    const { user } = res.locals
    await this.contactsService.updateContactAddress(
      {
        contactId: Number(contactId),
        contactAddressId: Number(contactAddressId),
        comments: req.body.comments ?? null,
      },
      user,
      req.id,
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
