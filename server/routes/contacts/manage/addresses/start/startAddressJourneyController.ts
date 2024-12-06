import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ContactsService from '../../../../../services/contactsService'
import ReturnPoint = journeys.ReturnPoint
import ContactNames = journeys.ContactNames
import AddressJourney = journeys.AddressJourney

export default class StartAddressJourneyController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.ADDRESS_START_PAGE

  private MAX_JOURNEYS = 5

  GET = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        contactAddressId?: string
      },
      unknown,
      unknown,
      { returnUrl: string }
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, contactAddressId } = req.params
    const { returnUrl } = req.query
    const { user } = res.locals
    const returnPoint: ReturnPoint = { url: returnUrl }
    const contact = await this.contactService.getContact(Number(contactId), user)
    const contactNames: ContactNames = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    const journey: AddressJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      returnPoint,
      prisonerNumber,
      contactId: Number(contactId),
      contactAddressId: Number(contactAddressId),
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
        .forEach(journeyToRemove => delete req.session.addressJourneys[journeyToRemove.id])
    }
    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type/${journey.id}`)
  }
}
