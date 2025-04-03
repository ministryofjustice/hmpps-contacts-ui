import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { getUpdateAddressDetails } from '../common/utils'
import ContactsService from '../../../../../services/contactsService'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { AddressFlagsSchemaType } from './addressFlagsSchemas'

export default class ChangeAddressFlagsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.SELECT_ADDRESS_FLAGS_PAGE

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
      primaryAddress: addressMetadata?.primaryAddress,
      mailAddress: addressMetadata?.mailAddress,
    }
    res.render('pages/contacts/manage/contactMethods/address/primaryOrPostal', viewModel)
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
      AddressFlagsSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId } = req.params
    const { user } = res.locals
    await this.contactsService.updateContactAddress(
      {
        contactId: Number(contactId),
        contactAddressId: Number(contactAddressId),
        primaryAddress: req.body.primaryAddress,
        mailAddress: req.body.mailAddress,
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
