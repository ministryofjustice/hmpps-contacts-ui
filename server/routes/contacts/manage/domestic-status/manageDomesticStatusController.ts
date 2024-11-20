import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ContactDetails = contactsApiClientTypes.ContactDetails
import { Navigation } from '../../common/navigation'

type PatchContactRequest = components['schemas']['PatchContactRequest']

export default class ManageDomesticStatusController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_DOMESTIC_STATUS_PAGE

  GET = async (req: Request<{ contactId?: string }>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { prisonerDetails, user, journey } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)

    const domesticStatusOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.DOMESTIC_STS, user)
      .then(val => this.getSelectedDomesticStatusOptions(val, contact.domesticStatusCode))
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    return res.render('pages/contacts/manage/contactDetails/manageDomesticStatus', {
      contact,
      prisonerDetails,
      domesticStatusOptions,
      navigation,
    })
  }

  POST = async (req: Request<{ contactId: string; prisonerNumber: string }>, res: Response): Promise<void> => {
    const { user, journey } = res.locals
    const { contactId } = req.params
    const request: PatchContactRequest = {
      domesticStatus: req.body.domesticStatusCode || null,
      updatedBy: user.username,
    }

    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)

    res.redirect(journey.returnPoint.url)
  }

  private getSelectedDomesticStatusOptions(
    options: ReferenceCode[],
    selected?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options.map((status: ReferenceCode) => {
      return {
        text: status.description,
        value: status.code,
        selected: status.code === selected,
        attributes: { 'data-qa': `status-${status.code}-option` },
      }
    })
    return [{ text: '', value: '' }, ...mappedOptions]
  }
}
