import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { EmailSchemaType } from '../emailSchemas'
import { ContactsService } from '../../../../../services'
import ContactDetails = contactsApiClientTypes.ContactDetails
import logger from '../../../../../../logger'

export default class ManageContactAddEmailController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE

  GET = async (req: Request<{ prisonerNumber: string; contactId: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { contactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const viewModel = {
      email: res.locals?.formResponses?.email,
      contact,
    }
    res.render('pages/contacts/manage/addEditEmail', viewModel)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string }, unknown, EmailSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId } = req.params
    const { email } = req.body
    const { journey } = res.locals
    logger.info(JSON.stringify(req.body))
    // await this.contactsService.createContactPhone(parseInt(contactId, 10), user, type, phoneNumber, extension)
    res.redirect(journey.returnPoint.url)
    // res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)
  }
}
