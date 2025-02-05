import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { ContactsService } from '../../../../../services'
import UpdateEmploymentsJourney = journeys.UpdateEmploymentsJourney

export default class UpdateEmploymentsStartController {
  constructor(private readonly contactsService: ContactsService) {}

  private MAX_JOURNEYS = 5

  GET = async (
    req: Request<{ contactId: string; prisonerNumber: string }, unknown, unknown, { returnUrl: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { prisonerNumber, contactId } = req.params
    const contact = await this.contactsService.getContact(Number(req.params.contactId), res.locals.user)
    const journey: UpdateEmploymentsJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      contactId: contact.id,
      contactNames: {
        title: contact.title,
        lastName: contact.lastName,
        firstName: contact.firstName,
        middleNames: contact.middleNames,
      },
      employments: contact.employments,
      returnPoint: { url: req.query.returnUrl },
      organisationSearch: { page: 1 },
    }

    // Add this journey to the list
    req.session.updateEmploymentsJourneys ??= {}
    req.session.updateEmploymentsJourneys[journey.id] = journey

    // Replace the oldest journey if more than MAX_JOURNEYS exist
    if (Object.entries(req.session.updateEmploymentsJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.updateEmploymentsJourneys)
        .sort(
          (a: UpdateEmploymentsJourney, b: UpdateEmploymentsJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.updateEmploymentsJourneys![journeyToRemove.id])
    }

    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${journey.id}`)
  }
}
