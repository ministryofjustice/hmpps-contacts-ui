import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import Contact = contactsApiClientTypes.Contact

type PatchContactRequest = components['schemas']['PatchContactRequest']

export default class ManageInterpreterController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_INTERPRETER_PAGE

  GET = async (req: Request<{ contactId?: string }>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { prisonerDetails, user } = res.locals
    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)

    return res.render('pages/contacts/manage/contactDetails/manageInterpreter', {
      contact,
      prisonerDetails,
    })
  }

  POST = async (req: Request<{ contactId: string; prisonerNumber: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { contactId, prisonerNumber } = req.params
    const request: PatchContactRequest = {
      interpreterRequired: req.body.interpreterRequired === 'YES',
      updatedBy: user.userId,
    }

    await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)

    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)
  }
}
