import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import Contact = contactsApiClientTypes.Contact
import ReferenceCode = contactsApiClientTypes.ReferenceCode

type PatchContactRequest = components['schemas']['PatchContactRequest']

export default class ManageDomesticStatusController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.MANAGE_DOMESTIC_STATUS_PAGE

  GET = async (req: Request<{ contactId?: string }>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { prisonerDetails, user } = res.locals
    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)

    const domesticStatusOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.DOMESTIC_STS, user)
      .then(val => this.getSelectedDomesticStatusOptions(val, contact.domesticStatusCode))
    return res.render('pages/contacts/manage/contactDetails/manageDomesticStatus', {
      contact,
      prisonerDetails,
      domesticStatusOptions,
    })
  }

  POST = async (req: Request<{ contactId: string; prisonerNumber: string }>, res: Response): Promise<void> => {
    const { user, journey } = res.locals
    const { contactId } = req.params
    const request: PatchContactRequest = {
      domesticStatus: req.body.domesticStatusCode || null,
      updatedBy: user.userId,
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
