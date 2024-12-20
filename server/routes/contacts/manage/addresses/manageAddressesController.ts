import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import ContactDetails = contactsApiClientTypes.ContactDetails
import ContactNames = journeys.ContactNames
import { getLabelForAddress } from '../../../../utils/findMostRelevantAddressAndLabel'
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import sortContactAddresses from '../../../../utils/sortAddress'

export default class ManageAddressesController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_MANAGE_ADDRESSES_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)

    const sortedAddresses = sortContactAddresses(contact.addresses)

    const addresses = sortedAddresses.map((address: ContactAddressDetails) => ({
      address,
      cardTitle: this.getExpiredAddressTitle(address.endDate, address.addressTypeDescription ?? 'Address'),
      mostRelevantAddressLabel: getLabelForAddress(address),
      cardActions: [
        {
          href: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/${address.contactAddressId}/phone/create?returnUrl=/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/view-addresses`,
          text: 'Add phone number',
          attributes: { 'data-qa': `add-address-phone-${address.contactAddressId}` },
          classes: 'govuk-link--no-visited-state',
        },
      ],
    }))

    const names: ContactNames = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }

    const navigation: Navigation = {
      backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    }
    const viewModel = {
      journey: { names },
      navigation,
      contact,
      addresses,
      prisonerNumber,
      contactId,
      prisonerContactId,
    }
    res.render('pages/contacts/common/manageAddresses', viewModel)
  }

  private getExpiredAddressTitle(endDate: string, addressTypeDescription: string): string {
    return this.isExpired(endDate) ? `${addressTypeDescription} (expired)` : addressTypeDescription
  }

  private isExpired(endDate: string): boolean {
    if (endDate) {
      const expirationDate = new Date(endDate)
      return expirationDate.getTime() < new Date().getTime()
    }
    return false
  }
}
