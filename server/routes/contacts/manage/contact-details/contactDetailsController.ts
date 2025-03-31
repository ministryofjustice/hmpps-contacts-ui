import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import RestrictionsService from '../../../../services/restrictionsService'
import { employmentSorter } from '../../../../utils/sorters'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import { setPaginationLocals } from '../../../../views/partials/simplePagination/utils'

export default class ContactDetailsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.CONTACT_DETAILS_PAGE

  private LINKED_PRISONER_ITEMS_PER_PAGE = 50

  GET = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId?: string },
      unknown,
      unknown,
      { linkedPrisonerPage?: string }
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { linkedPrisonerPage } = req.query
    const { user } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const prisonerContactRelationship: PrisonerContactRelationshipDetails =
      await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const navigation: Navigation = { breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'] }

    const { prisonerContactRestrictions, contactGlobalRestrictions } =
      await this.restrictionsService.getRelationshipAndGlobalRestrictions(Number(prisonerContactId), user)

    const linkedPrisonerPageNumber =
      linkedPrisonerPage && !Number.isNaN(Number(linkedPrisonerPage)) ? Number(linkedPrisonerPage) : 1

    const linkedPrisoners = await this.contactsService.getLinkedPrisoners(
      contact.id,
      linkedPrisonerPageNumber - 1,
      this.LINKED_PRISONER_ITEMS_PER_PAGE,
      user,
    )
    const linkedPrisonersCount = linkedPrisoners?.page?.totalElements ?? 0
    setPaginationLocals(
      res,
      this.LINKED_PRISONER_ITEMS_PER_PAGE,
      linkedPrisonerPageNumber,
      linkedPrisonersCount,
      linkedPrisoners?.content?.length ?? 0,
      '?linkedPrisonerPage={page}#linked-prisoners',
    )

    contact.employments = contact.employments.sort(employmentSorter)

    return res.render('pages/contacts/manage/contactDetails/details/index', {
      contact,
      contactGlobalRestrictions,
      prisonerContactRestrictions,
      prisonerNumber,
      contactId,
      prisonerContactId,
      prisonerContactRelationship,
      manageContactRelationshipUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
      navigation,
      linkedPrisoners: linkedPrisoners.content,
      linkedPrisonersCount,
    })
  }
}
