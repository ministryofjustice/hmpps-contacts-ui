import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import Urls from '../../../urls'
import { ContactDetails } from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'

export default class EditContactConfirmController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly editType: 'contact-details' | 'contact-methods',
  ) {}

  public PAGE_NAME = Page.EDIT_CONTACT_DETAILS_CONFIRM_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)

    const linkedPrisonersCount =
      (await this.contactsService.getLinkedPrisoners(contact.id, 0, 1, user)).page?.totalElements ?? 0

    const contactDetailsUrl = Urls.contactDetails(prisonerNumber, contactId, prisonerContactId)
    const navigation: Navigation = {
      backLinkLabel: 'Back to contact record',
      backLink: `${contactDetailsUrl}#${this.editType}`,
    }

    return res.render('pages/contacts/manage/editContactConfirm', {
      hideMiniProfile: true,
      linkedPrisonersCount,
      contact,
      navigation,
    })
  }
}
