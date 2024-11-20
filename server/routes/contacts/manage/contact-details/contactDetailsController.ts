import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'

import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

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
    const mostRelevantAddress = this.findMostRelevantAddress(contact)
    const mostRelevantAddressLabel = this.getLabelForAddress(mostRelevantAddress)
    const prisonerContactRelationship: PrisonerContactRelationshipDetails =
      await this.contactsService.getPrisonerContactRelationship(Number(prisonerContactId), user)
    const formattedFullName = await this.formattedFullName(contact, user)

    return res.render('pages/contacts/manage/contactDetails/details', {
      contact,
      mostRelevantAddress,
      mostRelevantAddressLabel,
      prisonerContactId,
      prisonerContactRelationship,
      formattedFullName,
      manageContactRelationshipUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
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

  private findMostRelevantAddress(contact: contactsApiClientTypes.ContactDetails) {
    const currentAddresses = contact.addresses?.filter((address: ContactAddressDetails) => !address.endDate)
    let mostRelevantAddress: ContactAddressDetails = currentAddresses?.find(
      (address: ContactAddressDetails) => address.primaryAddress,
    )
    if (!mostRelevantAddress) {
      mostRelevantAddress = currentAddresses?.find((address: ContactAddressDetails) => address.mailFlag)
    }
    if (!mostRelevantAddress) {
      mostRelevantAddress = currentAddresses?.reduce((seed: ContactAddressDetails, item: ContactAddressDetails) => {
        return (seed && seed.startDate > item.startDate) || !item.startDate ? seed : item
      }, null)
    }
    if (!mostRelevantAddress) {
      mostRelevantAddress = currentAddresses?.reduce((seed: ContactAddressDetails, item: ContactAddressDetails) => {
        return seed && seed.createdTime > item.createdTime ? seed : item
      }, null)
    }
    return mostRelevantAddress
  }

  private getLabelForAddress(mostRelevantAddress: contactsApiClientTypes.ContactAddressDetails) {
    let mostRelevantAddressLabel
    if (mostRelevantAddress?.primaryAddress) {
      if (mostRelevantAddress?.mailFlag) {
        mostRelevantAddressLabel = 'Primary and mail'
      } else {
        mostRelevantAddressLabel = 'Primary'
      }
    } else if (mostRelevantAddress?.mailFlag) {
      mostRelevantAddressLabel = 'Mail'
    }
    return mostRelevantAddressLabel
  }
}
