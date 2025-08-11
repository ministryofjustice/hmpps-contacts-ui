import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Urls from '../../../../urls'
import { getUpdateAddressDetails } from '../common/utils'
import { PhonesSchemaType } from './AddAddressPhonesSchema'
import Permission from '../../../../../enumeration/permission'

export default class ManageContactAddAddressPhoneController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.ADD_ADDRESS_PHONE_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactAddressId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { formattedAddress } = await getUpdateAddressDetails(this.contactsService, req, res)
    const typeOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user)
    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      isEdit: true,
      navigation,
      typeOptions,
      formattedAddress,
      phones: res.locals?.formResponses?.['phones'] ?? [{ type: '', phoneNumber: '', extension: '' }],
    }
    res.render('pages/contacts/manage/contactMethods/address/phone/addAddressPhone', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string; contactAddressId: string },
      unknown,
      PhonesSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId } = req.params
    const { phones, save, add, remove } = req.body
    if (save !== undefined) {
      await this.contactsService.createContactAddressPhones(
        parseInt(contactId, 10),
        parseInt(contactAddressId, 10),
        user,
        phones,
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
    } else {
      if (add !== undefined) {
        phones.push({ type: '', phoneNumber: '', extension: '' })
      } else if (remove !== undefined) {
        phones.splice(Number(remove), 1)
      }
      // Always redirect back to input even if we didn't find an action, which should be impossible but there is a small
      // possibility if JS is disabled after a page load or the user somehow removes all identities.
      req.flash('formResponses', JSON.stringify(req.body))
      res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/phone/create`,
      )
    }
  }
}
