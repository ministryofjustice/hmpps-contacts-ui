import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import Contact = contactsApiClientTypes.Contact
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'

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
    const domesticStatuses = await this.referenceDataService.getReferenceData(ReferenceCodeType.DOMESTIC_STS, user)

    return res.render('pages/contacts/manage/contactDetails/manageDomesticStatus', {
      contact,
      prisonerDetails,
      domesticStatuses,
    })
  }

  POST = async (req: Request<{ contactId: string; prisonerNumber: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { contactId, prisonerNumber } = req.params
    const request: PatchContactRequest = {
      domesticStatus: req.body.domesticStatusCode || null,
      updatedBy: user.userId,
    }

    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)

    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)
  }
}
