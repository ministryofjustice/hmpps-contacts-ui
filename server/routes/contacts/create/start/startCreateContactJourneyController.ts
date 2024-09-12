import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CreateContactJourney = journeys.CreateContactJourney
import ReturnPointType = journeys.ReturnPointType
import ReturnPoint = journeys.ReturnPoint

export default class StartCreateContactJourneyController implements PageHandler {
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
      returnPoint = { type: 'HOME', url: '/' }
    }
    const journey: CreateContactJourney = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      isCheckingAnswers: false,
      returnPoint,
      prisonerNumber,
    }
    if (!req.session.createContactJourneys) {
      req.session.createContactJourneys = {}
    }
    req.session.createContactJourneys[journey.id] = journey
    if (Object.entries(req.session.createContactJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.createContactJourneys)
        .sort(
          (a: CreateContactJourney, b: CreateContactJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.createContactJourneys[journeyToRemove.id])
    }
    res.redirect(`/prisoner/${req.params.prisonerNumber}/contacts/create/enter-name/${journey.id}`)
  }
}
