import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import { ContactsService } from '../../../../../services'
import { components } from '../../../../../@types/contactsApi'
import ReferenceDataService from '../../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import { ManageDomesticStatusSchemaType } from './manageDomesticStatusSchema'

type PatchContactRequest = components['schemas']['PatchContactRequest']

export default class ManageDomesticStatusController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_DOMESTIC_STATUS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)

    const domesticStatusOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.DOMESTIC_STS, user)
      .then(val => this.getSelectedOptions(val, contact.domesticStatusCode))

    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    return res.render('pages/contacts/manage/contactDetails/manageDomesticStatus', {
      isOptional: false,
      caption: 'Edit additional information for a contact',
      continueButtonLabel: 'Confirm and save',
      contact,
      domesticStatusOptions,
      navigation,
    })
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string },
      unknown,
      ManageDomesticStatusSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const request: PatchContactRequest = {
      domesticStatusCode: req.body.domesticStatusCode,
      updatedBy: user.username,
    }

    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)
    await this.contactsService.getContact(Number(contactId), user).then(response => {
      req.flash(
        FLASH_KEY__SUCCESS_BANNER,
        `You’ve updated the additional information for ${formatNameFirstNameFirst(response)}.`,
      )
    })
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }

  private getSelectedOptions(
    options: ReferenceCode[],
    selected?: string,
  ): Array<{
    text: string
    value: string
    checked?: boolean
  }> {
    return options.map((itm: ReferenceCode) => {
      return {
        text: itm.description,
        value: itm.code,
        checked: itm.code === selected,
        attributes: { 'data-qa': `status-${itm.code}-option` },
      }
    })
  }
}
