import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import ContactDetails = contactsApiClientTypes.ContactDetails
import Urls from '../../../urls'
import RestrictionsService from '../../../../services/restrictionsService'

export default class EditRestrictionsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.EDIT_RESTRICTIONS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const { prisonerContactRestrictions, contactGlobalRestrictions } =
      await this.restrictionsService.getRelationshipAndGlobalRestrictions(Number(prisonerContactId), user)
    const navigation: Navigation = {
      backLinkLabel: 'Back to contact record',
      backLink: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    return res.render('pages/contacts/manage/contactDetails/details/editRestrictions', {
      contact,
      prisonerContactRestrictions,
      contactGlobalRestrictions,
      prisonerNumber,
      contactId,
      prisonerContactId,
      navigation,
    })
  }
}
