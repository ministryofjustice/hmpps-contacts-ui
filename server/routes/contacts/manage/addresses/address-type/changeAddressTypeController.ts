import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { AddressTypeSchema } from './addressTypeSchemas'
import Urls from '../../../../urls'
import { getUpdateAddressDetails } from '../common/utils'
import ContactsService from '../../../../../services/contactsService'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'

export default class ChangeAddressTypeController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.SELECT_ADDRESS_TYPE_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactAddressId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const { contact, addressType, formattedAddress } = await getUpdateAddressDetails(this.contactsService, req, res)

    const typeOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.ADDRESS_TYPE, user)

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
      addressType: res.locals?.formResponses?.['type'] ?? addressType,
      typeOptions,
      navigation,
    }
    res.render('pages/contacts/manage/contactMethods/address/addressType', viewModel)
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
      AddressTypeSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId } = req.params
    const { user } = res.locals
    await this.contactsService.updateContactAddress(
      {
        contactId: Number(contactId),
        contactAddressId: Number(contactAddressId),
        addressType: req.body.addressType,
      },
      user,
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
