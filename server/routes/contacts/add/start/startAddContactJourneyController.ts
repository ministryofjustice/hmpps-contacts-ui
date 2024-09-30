import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { nextPageForAddContactJourney } from '../addContactFlowControl'
import AddContactJourney = journeys.AddContactJourney
import ReturnPointType = journeys.ReturnPointType
import ReturnPoint = journeys.ReturnPoint

export default class StartAddContactJourneyController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_START_PAGE

  private MAX_JOURNEYS = 5

  GET = async (
    req: Request<
      { prisonerNumber: string },
      unknown,
      unknown,
      {
        returnJourneyType?: ReturnPointType
        returnJourneyId?: string
      }
    >,
    res: Response,
  ): Promise<void> => {
    const { returnJourneyType, returnJourneyId } = req.query
    const { prisonerNumber } = req.params
    let returnPoint: ReturnPoint
    if (returnJourneyType === 'MANAGE_PRISONER_CONTACTS') {
      returnPoint = {
        type: 'MANAGE_PRISONER_CONTACTS',
        url: `/prisoner/${prisonerNumber}/contacts/list/${returnJourneyId}`,
      }
    } else {
      returnPoint = { type: 'PRISONER_CONTACTS', url: `/prisoner/${prisonerNumber}/contacts/list` }
    }
    const journey: AddContactJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      isCheckingAnswers: false,
      returnPoint,
      prisonerNumber,
      isContactConfirmed: undefined,
    }
    if (!req.session.addContactJourneys) {
      req.session.addContactJourneys = {}
    }
    req.session.addContactJourneys[journey.id] = journey
    if (Object.entries(req.session.addContactJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.addContactJourneys)
        .sort(
          (a: AddContactJourney, b: AddContactJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.addContactJourneys[journeyToRemove.id])
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
