import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { NextOfKinSchema } from './nextOfKinSchemas'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import captionForAddContactJourney from '../addContactsUtils'

export default class NextOfKinController implements PageHandler {
  public PAGE_NAME = Page.SELECT_NEXT_OF_KIN

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const view = {
      journey,
      caption: captionForAddContactJourney(journey),
      isNextOfKin: res.locals?.formResponses?.isNextOfKin ?? journey?.relationship?.isNextOfKin,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/selectNextOfKin', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, NextOfKinSchema>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const { body } = req
    journey.relationship.isNextOfKin = body.isNextOfKin
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
