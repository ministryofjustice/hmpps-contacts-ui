import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ContactsService from '../../../services/contactsService'
import { AddRestrictionJourney, ContactNames, RestrictionClass } from '../../../@types/journeys'
import Permission from '../../../enumeration/permission'

export default class StartAddRestrictionJourneyController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.ADD_RESTRICTION_START_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_RESTRICTIONS

  private MAX_JOURNEYS = 5

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      restrictionClass: RestrictionClass
    }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    const { user } = res.locals
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
