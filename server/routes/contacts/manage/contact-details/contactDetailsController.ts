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
import { employmentSorter } from '../../../../utils/sorters'
import sortContactAddresses from '../../../../utils/sortAddress'
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

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
    const mostRelevantAddress = findMostRelevantAddress(contact, true)
    const mostRelevantAddressLabel = getLabelForAddress(mostRelevantAddress)
    const prisonerContactRelationship: PrisonerContactRelationshipDetails =
      await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const formattedFullName = await this.formattedFullName(contact, user)
    const navigation: Navigation = { breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'] }

    const prisonerContactRestrictionsEnriched = await this.restrictionsService.getPrisonerContactRestrictions(
      Number(prisonerContactId),
      user,
    )

    contact.employments = contact.employments.sort(employmentSorter)

    const sortedAddresses = sortContactAddresses(contact.addresses)

    const addresses = sortedAddresses.map((address: ContactAddressDetails) => {
      const expired = this.isExpiredAddress(address.endDate)
      return {
        ...address,
        isExpired: expired,
        addressTitle: this.getAddressTitle(address, expired),
      }
    })

    return res.render('pages/contacts/manage/contactDetails/details/index', {
      contact,
      globalRestrictions: prisonerContactRestrictionsEnriched.contactGlobalRestrictions,
      prisonerContactRestrictions: prisonerContactRestrictionsEnriched.prisonerContactRestrictions,
      addresses,
      mostRelevantAddress,
      mostRelevantAddressLabel,
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
    let titleDescription: string | undefined
    if (contact.title) {
      titleDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.TITLE,
        contact.title,
        user,
      )
    }
    return formatNameFirstNameFirst(contact, { customTitle: titleDescription })
  }

  private getAddressTitle(address: ContactAddressDetails, expired: boolean): string {
    let title = address.addressTypeDescription ?? 'Address'
    if (address.primaryAddress && address.mailFlag) {
      title = 'Primary and postal address'
    } else if (address.primaryAddress) {
      title = 'Primary address'
    } else if (address.mailFlag) {
      title = 'Postal address'
    }
    return expired ? `Previous ${title.toLowerCase()}` : title
  }

  private isExpiredAddress(endDate: string): boolean {
    if (endDate) {
      const expirationDate = new Date(endDate)
      return expirationDate.getTime() < new Date().getTime()
    }
    return false
  }
}
