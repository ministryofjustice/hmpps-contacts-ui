import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { getUpdateAddressDetails } from '../common/utils'
import ContactsService from '../../../../../services/contactsService'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { AddressDatesSchemaType } from './addressDatesSchemas'
import Permission from '../../../../../enumeration/permission'

export default class ChangeAddressDatesController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.ENTER_ADDRESS_DATES_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

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
      contact,
      formattedAddress,
      navigation,
      fromMonth: res.locals?.formResponses?.['fromMonth'] ?? addressMetadata?.fromMonth,
      fromYear: res.locals?.formResponses?.['fromYear'] ?? addressMetadata?.fromYear,
      toMonth: res.locals?.formResponses?.['toMonth'] ?? addressMetadata?.toMonth,
      toYear: res.locals?.formResponses?.['toYear'] ?? addressMetadata?.toYear,
    }
    res.render('pages/contacts/manage/contactMethods/address/dates', viewModel)
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
      AddressDatesSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId } = req.params
    const { user } = res.locals
    const { fromMonth, fromYear, toMonth, toYear } = req.body

    await this.contactsService.updateContactAddress(
      {
        contactId: Number(contactId),
        contactAddressId: Number(contactAddressId),
        startDate: new Date(`${fromYear}-${fromMonth}-01Z`),
        endDate: toMonth && toYear ? new Date(`${toYear}-${toMonth}-01Z`) : null,
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
