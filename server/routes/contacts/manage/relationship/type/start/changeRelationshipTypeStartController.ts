import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { ContactsService } from '../../../../../../services'
import { PageHandler } from '../../../../../../interfaces/pageHandler'
import { Page } from '../../../../../../services/auditService'
import ChangeRelationshipTypeJourney = journeys.ChangeRelationshipTypeJourney

export default class ChangeRelationshipTypeStartController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.CHANGE_RELATIONSHIP_TYPE_START_PAGE

  private MAX_JOURNEYS = 5

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }>,
    res: Response,
  ) => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const contact = await this.contactsService.getContact(Number(contactId), res.locals.user)
    const relationship = await this.contactsService.getPrisonerContactRelationship(
      Number(prisonerContactId),
      res.locals.user,
    )
    const journey: ChangeRelationshipTypeJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      prisonerNumber,
      contactId: contact.id,
      prisonerContactId: relationship.prisonerContactId,
      names: {
        title: contact.title,
        lastName: contact.lastName,
        firstName: contact.firstName,
        middleNames: contact.middleNames,
      },
      relationshipType: relationship.relationshipType,
      relationshipToPrisoner: relationship.relationshipToPrisonerCode,
    }

    // Add this journey to the list
    req.session.changeRelationshipTypeJourneys ??= {}
    req.session.changeRelationshipTypeJourneys[journey.id] = journey

    // Replace the oldest journey if more than MAX_JOURNEYS exist
    if (Object.entries(req.session.changeRelationshipTypeJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.changeRelationshipTypeJourneys)
        .sort(
          (a: ChangeRelationshipTypeJourney, b: ChangeRelationshipTypeJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.changeRelationshipTypeJourneys![journeyToRemove.id])
    }

    res.redirect(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/type/select-new-relationship-type/${journey.id}`,
    )
  }
}
