import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../../services'
import { Navigation } from '../../../common/navigation'
import Urls from '../../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'
import Permission from '../../../../../enumeration/permission'
import { DeleteRelationshipSchemaType } from './deleteRelationshipActionSchema'

export default class DeleteRelationshipController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_DELETE_RELATIONSHIP

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { backTo } = req.query
    const contact = await this.contactsService.getContactName(Number(contactId), user)
    const restrictions = await this.contactsService.getPrisonerContactRestrictions(Number(prisonerContactId), user)
    const summary = await this.contactsService
      .getAllSummariesForPrisonerAndContact(prisonerNumber, Number(contactId), user)
      .then(summaries => summaries.find(it => it.prisonerContactId === Number(prisonerContactId)))
    if (!summary) {
      throw Error(`Failed to find prisoner contact summary by id: ${prisonerContactId}`)
    }
    let mode = 'BLOCKED'
    if (restrictions.prisonerContactRestrictions && restrictions.prisonerContactRestrictions.length === 0) {
      mode = 'ALLOWED'
    }
    const navigation: Navigation = {
      backLink:
        backTo && backTo === 'contact-details'
          ? Urls.contactDetails(prisonerNumber, contactId, prisonerContactId)
          : Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      contact,
      mode,
      summary,
      navigation,
    }
    res.render('pages/contacts/manage/contactDetails/relationship/deleteRelationship', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string },
      unknown,
      DeleteRelationshipSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { deleteRelationshipAction } = req.body
    if (deleteRelationshipAction === 'DELETE') {
      // we don't need to revalidate whether they are allowed to delete the relationship because even if manually
      // manipulated it is enforced by the backend.
      await this.contactsService
        .deleteContactRelationship(prisonerNumber, Number(contactId), Number(prisonerContactId), user, req.id)
        .then(() => {
          req.flash(
            FLASH_KEY__SUCCESS_BANNER,
            `You’ve deleted a relationship from ${formatNameFirstNameFirst(prisonerDetails!, { excludeMiddleNames: true, possessiveSuffix: true })} contact list.`,
          )
        })
      return res.redirect(Urls.contactList(prisonerNumber))
    }
    if (deleteRelationshipAction === 'GO_TO_CONTACT_LIST') {
      return res.redirect(Urls.contactList(prisonerNumber))
    }
    if (deleteRelationshipAction === 'GO_TO_CONTACT_RECORD') {
      return res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
    }
    throw Error(`Unknown deleteRelationshipAction: ${deleteRelationshipAction}`)
  }
}
