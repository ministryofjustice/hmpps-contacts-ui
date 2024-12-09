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
import RestrictionsService from '../../../../services/restrictionsService'
import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails

export default class ContactDetailsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
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

    const prisonerContactRestrictionsEnriched = await this.restrictionsService.getPrisonerContactRestrictions(
      Number(prisonerContactId),
      user,
    )

    return res.render('pages/contacts/manage/contactDetails/details', {
      contact,
      globalRestrictions: this.enrichContactRestrictions(
        prisonerContactRestrictionsEnriched.contactGlobalRestrictions,
        prisonerNumber,
        contactId,
        prisonerContactId,
        `CONTACT_GLOBAL`,
      ),
      prisonerContactRestrictions: this.enrichContactRestrictions(
        prisonerContactRestrictionsEnriched.prisonerContactRestrictions,
        prisonerNumber,
        contactId,
        prisonerContactId,
        `PRISONER_CONTACT`,
      ),
      primaryAddress,
      prisonerNumber,
      contactId,
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

  private enrichContactRestrictions(
    restrictions: ContactRestrictionDetails[],
    prisonerNumber: string,
    contactId: string,
    prisonerContactId: string,
    restrictionType: string = `PRISONER_CONTACT`,
  ): ContactRestrictionDetails[] {
    return restrictions.map(restriction => {
      const manageRestrictionUrl = this.generateManagePrisonerRestrictionUrl(
        prisonerNumber,
        contactId,
        prisonerContactId,
        restriction.contactRestrictionId,
        restrictionType,
      )
      return {
        ...restriction,
        manageRestrictionUrl,
      }
    })
  }

  private generateManagePrisonerRestrictionUrl(
    prisonerNumber: string,
    contactId: string,
    prisonerContactId: string,
    restrictionId: number,
    restrictionType: string = `PRISONER_CONTACT`,
  ): string {
    return `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/update/${restrictionType}/enter-restriction/${restrictionId}?returnUrl=/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`
  }
}
