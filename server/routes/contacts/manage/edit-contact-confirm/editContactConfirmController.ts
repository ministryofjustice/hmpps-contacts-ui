import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import Urls from '../../../urls'
import { ContactDetails } from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'
import { EditContactConfirmSchemaType } from './editContactConfirmSchema'

export default class EditContactConfirmController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly editType: 'contact-details' | 'contact-methods',
  ) {}

  public PAGE_NAME = Page.EDIT_CONTACT_CONFIRM_PAGE

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

    const navigation: Navigation = {
      backLinkLabel: 'Back to contact record',
      backLink: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    return res.render('pages/contacts/manage/editContactConfirm', {
      hideMiniProfile: true,
      linkedPrisonersCount,
      contact,
      navigation,
    })
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string },
      unknown,
      EditContactConfirmSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params

    if (req.body.confirmContactEdit === 'YES') {
      const redirectUrl =
        this.editType === 'contact-details'
          ? Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId)
          : Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId)
      return res.redirect(redirectUrl)
    }

    return res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
