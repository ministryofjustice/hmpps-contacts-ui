import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import { findMostRelevantAddress, getLabelForAddress } from '../../../../utils/findMostRelevantAddressAndLabel'
import { Navigation } from '../../common/navigation'

import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails

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
    const mostRelevantAddress = findMostRelevantAddress(contact)
    const mostRelevantAddressLabel = getLabelForAddress(mostRelevantAddress)
    const prisonerContactRelationship: PrisonerContactRelationshipDetails =
      await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const formattedFullName = await this.formattedFullName(contact, user)
    const navigation: Navigation = { breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'] }

    const manageContactUrl = `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`
    const manageContactReturnUrl = `${manageContactUrl}/view-addresses`

    let primaryAddress
    if (mostRelevantAddress) {
      primaryAddress = [
        {
          mostRelevantAddressLabel,
          address: mostRelevantAddress,
          cardLabel: 'Addresses',
          cardActions: [
            {
              href: manageContactReturnUrl,
              text: 'View all addresses',
              attributes: { 'data-qa': 'view-all-addresses' },
              classes: 'govuk-link--no-visited-state',
            },
          ],
          changeLink: 'false',
        },
      ]
    }

    return res.render('pages/contacts/manage/contactDetails/details', {
      contact,
      primaryAddress,
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
