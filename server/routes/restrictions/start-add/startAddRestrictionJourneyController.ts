import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ContactsService from '../../../services/contactsService'
import ReturnPoint = journeys.ReturnPoint
import AddRestrictionJourney = journeys.AddRestrictionJourney
import ContactNames = journeys.ContactNames
import RestrictionClass = journeys.RestrictionClass

export default class StartAddRestrictionJourneyController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.ADD_RESTRICTION_START_PAGE

  private MAX_JOURNEYS = 5

  GET = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        restrictionClass: RestrictionClass
      },
      unknown,
      unknown,
      { returnUrl: string }
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    const { returnUrl } = req.query
    const { user } = res.locals
    const returnPoint: ReturnPoint = { url: returnUrl }
    const contact = await this.contactService.getContactName(Number(contactId), user)
    const contactNames: ContactNames = {
      title: contact.titleDescription,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    const journey: AddRestrictionJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      restrictionClass,
      returnPoint,
      prisonerNumber,
      contactId: Number(contactId),
      prisonerContactId: Number(prisonerContactId),
      contactNames,
    }
    if (!req.session.addRestrictionJourneys) {
      req.session.addRestrictionJourneys = {}
    }
    req.session.addRestrictionJourneys[journey.id] = journey
    if (Object.entries(req.session.addRestrictionJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.addRestrictionJourneys)
        .sort(
          (a: AddRestrictionJourney, b: AddRestrictionJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.addRestrictionJourneys![journeyToRemove.id])
    }
    res.redirect(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/enter-restriction/${journey.id}`,
    )
  }
}
