import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'

export default class CreateContactCheckAnswersController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE

  GET = async (req: Request<{ journeyId: string }, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    journey.isCheckingAnswers = true
    let dateOfBirth
    if (journey.dateOfBirth.isKnown === 'Yes') {
      dateOfBirth = new Date(`${journey.dateOfBirth.year}-${journey.dateOfBirth.month}-${journey.dateOfBirth.day}Z`)
    }

    const view = {
      journey,
      dateOfBirth,
    }
    res.render('pages/contacts/create/checkAnswers', view)
  }

  POST = async (req: Request<{ journeyId: string }, unknown, unknown>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    await this.contactService
      .createContact(journey, user)
      .then(() => delete req.session.createContactJourneys[journeyId])
    res.redirect('/contacts/create/success')
  }
}
