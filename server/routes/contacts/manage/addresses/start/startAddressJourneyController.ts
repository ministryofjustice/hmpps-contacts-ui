import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ContactsService from '../../../../../services/contactsService'
import { AddressJourney, ContactNames } from '../../../../../@types/journeys'
import Permission from '../../../../../enumeration/permission'

export default class StartAddressJourneyController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.ADDRESS_START_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  private MAX_JOURNEYS = 5

  GET = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
      },
      unknown,
      unknown
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact = await this.contactService.getContactName(Number(contactId), user)
    const contactNames: ContactNames = {
      title: contact.titleDescription,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }

    const journey: AddressJourney = {
      id: randomUUID(),
      lastTouched: new Date().toISOString(),
      prisonerNumber,
      contactId: Number(contactId),
      isCheckingAnswers: false,
      contactNames,
    }
    if (!req.session.addressJourneys) {
      req.session.addressJourneys = {}
    }
    req.session.addressJourneys[journey.id] = journey
    if (Object.entries(req.session.addressJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.addressJourneys)
        .sort(
          (a: AddressJourney, b: AddressJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.addressJourneys![journeyToRemove.id])
    }
    res.redirect(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type/${journey.id}`,
    )
  }
}
