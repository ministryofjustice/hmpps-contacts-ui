import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { NextOfKinSchema } from './nextOfKinSchemas'

export default class NextOfKinController implements PageHandler {
  public PAGE_NAME = Page.SELECT_NEXT_OF_KIN

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const view = {
      journey,
      isNextOfKin: res.locals?.formResponses?.isNextOfKin ?? journey?.relationship?.isNextOfKin,
    }
    res.render('pages/contacts/add/selectNextOfKin', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, NextOfKinSchema>, res: Response): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const { body } = req
    journey.relationship.isNextOfKin = body.isNextOfKin
    if (journey.isCheckingAnswers) {
      res.redirect(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
    } else {
      res.redirect(`/prisoner/${prisonerNumber}/contacts/create/enter-dob/${journeyId}`)
    }
  }
}
