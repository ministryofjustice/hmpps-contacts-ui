import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { nextPageForAddContactJourney } from '../addContactFlowControl'
import { ContactsService } from '../../../../services'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class AddContactModeController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.ADD_CONTACT_MODE_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { mode?: 'EXISTING' | 'NEW' }, unknown, unknown, { contactId?: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, mode } = req.params
    const { user } = res.locals

    const journey = req.session.addContactJourneys![journeyId]!
    journey.mode = mode
    journey.isCheckingAnswers = false
    if (journey.mode === 'EXISTING' && journey.contactId) {
      journey.contactId = Number(journey.contactId)
      const existingContact = await this.contactService.getContact(journey.contactId, user)
      journey.names = {
        title: existingContact.title,
        lastName: existingContact.lastName,
        firstName: existingContact.firstName,
        middleNames: existingContact.middleNames,
      }
      journey.existingContact = {
        deceasedDate: existingContact.deceasedDate,
      }
      if (existingContact.dateOfBirth) {
        const date = new Date(existingContact.dateOfBirth)
        journey.dateOfBirth = {
          isKnown: 'YES',
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
        }
      } else {
        journey.dateOfBirth = {
          isKnown: 'NO',
        }
      }
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
