import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { EmailSchemaType } from '../emailSchemas'
import { ContactsService } from '../../../../../services'
import { components } from '../../../../../@types/contactsApi'
import ContactDetails = contactsApiClientTypes.ContactDetails
import logger from '../../../../../../logger'

type CreateEmailRequest = components['schemas']['CreateEmailRequest']

export default class ManageContactAddEmailController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE

  GET = async (req: Request<{ prisonerNumber: string; contactId: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { contactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const viewModel = {
      emailAddress: res.locals?.formResponses?.emailAddress,
      contact,
    }
    logger.info(JSON.stringify(res.locals?.validationErrors))
    res.render('pages/contacts/manage/addEditEmail', viewModel)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string }, unknown, EmailSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { contactId } = req.params
    const { emailAddress } = req.body
    const { journey } = res.locals
    const request: CreateEmailRequest = {
      emailAddress,
      createdBy: user.name,
    }
    await this.contactsService.createContactEmail(parseInt(contactId, 10), request, user)
    res.redirect(journey.returnPoint.url)
  }
}
