import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import { Navigation } from '../../common/navigation'

export default class ContactDetailsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
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
    const formattedFullName = await this.formattedFullName(contact, user)
    const navigation: Navigation = { breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'] }
    return res.render('pages/contacts/manage/contactDetails/details', {
      contact,
      prisonerContactId,
      prisonerContactRelationship,
      formattedFullName,
      manageContactRelationshipUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
      navigation,
    })
  }

  private async formattedFullName(contact: ContactDetails, user: Express.User) {
    let titleDescription: string
    if (contact.title) {
      titleDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.TITLE,
        contact.title,
        user,
      )
    }
    return formatNameFirstNameFirst(contact, { customTitle: titleDescription })
  }
}
