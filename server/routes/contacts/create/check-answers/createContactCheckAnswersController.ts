import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class CreateContactCheckAnswersController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    journey.isCheckingAnswers = true
    let dateOfBirth
    if (journey.dateOfBirth.isKnown === 'YES') {
      dateOfBirth = new Date(`${journey.dateOfBirth.year}-${journey.dateOfBirth.month}-${journey.dateOfBirth.day}Z`)
    }

    const view = {
      journey,
      dateOfBirth,
    }
    res.render('pages/contacts/create/checkAnswers', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId, prisonerNumber } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    await this.contactService
      .createContact(journey, user)
      .then(() => delete req.session.createContactJourneys[journeyId])

    if (journey.returnPoint.type === 'MANAGE_PRISONER_CONTACTS') {
      res.redirect(journey.returnPoint.url)
    } else {
      res.redirect(`/prisoner/${prisonerNumber}/contacts/create/success`)
    }
  }
}
