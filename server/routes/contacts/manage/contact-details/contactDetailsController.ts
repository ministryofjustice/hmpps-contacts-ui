import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import RestrictionsService from '../../../../services/restrictionsService'
import { employmentSorter } from '../../../../utils/sorters'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails

export default class ContactDetailsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.CONTACT_DETAILS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId?: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const prisonerContactRelationship: PrisonerContactRelationshipDetails =
      await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const navigation: Navigation = { breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'] }

    const prisonerContactRestrictionsEnriched = await this.restrictionsService.getPrisonerContactRestrictions(
      Number(prisonerContactId),
      user,
    )

    const linkedPrisoners = await this.contactsService.getLinkedPrisoners(contact.id, user)

    contact.employments = contact.employments.sort(employmentSorter)

    return res.render('pages/contacts/manage/contactDetails/details/index', {
      contact,
      globalRestrictions: prisonerContactRestrictionsEnriched.contactGlobalRestrictions,
      prisonerContactRestrictions: prisonerContactRestrictionsEnriched.prisonerContactRestrictions,
      prisonerNumber,
      contactId,
      prisonerContactId,
      prisonerContactRelationship,
      manageContactRelationshipUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
      navigation,
      linkedPrisoners,
      linkedPrisonerCount: linkedPrisoners.flatMap(linkedPrisoner => linkedPrisoner.relationships).length,
    })
  }
}
