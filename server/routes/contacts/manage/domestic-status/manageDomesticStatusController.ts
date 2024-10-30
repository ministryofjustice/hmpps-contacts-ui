import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import Contact = contactsApiClientTypes.Contact

type PatchContactRequest = components['schemas']['PatchContactRequest']

export default class ManageDomesticStatusController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_DOMESTIC_STATUS_PAGE

  GET = async (req: Request<{ contactId?: string }>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { prisonerDetails, user } = res.locals
    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const domesticStatuses = [
      { domesticStatusCode: 'S', domesticStatusDescription: 'Married or in civil partnership' },
      { domesticStatusCode: 'C', domesticStatusDescription: 'Co-habiting (living with partner)' },
      { domesticStatusCode: 'M', domesticStatusDescription: 'Married or in civil partnership' },
      { domesticStatusCode: 'D', domesticStatusDescription: 'Divorced or dissolved' },
      { domesticStatusCode: 'P', domesticStatusDescription: 'Separated-not living with legal partnership' },
      { domesticStatusCode: 'W', domesticStatusDescription: 'Widowed' },
      { domesticStatusCode: 'N', domesticStatusDescription: 'Prefer not to say' },
    ]
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
