import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { EmergencyContactSchema } from './emergencyContactSchemas'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class EmergencyContactController implements PageHandler {
  public PAGE_NAME = Page.SELECT_EMERGENCY_CONTACT

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const view = {
      journey,
      isEmergencyContact: res.locals?.formResponses?.isEmergencyContact ?? journey?.relationship?.isEmergencyContact,
    }
    res.render('pages/contacts/common/selectEmergencyContact', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, EmergencyContactSchema>, res: Response): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const { body } = req
    journey.relationship.isEmergencyContact = body.isEmergencyContact
    if (journey.isCheckingAnswers) {
      res.redirect(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
    } else {
      res.redirect(`/prisoner/${prisonerNumber}/contacts/create/select-next-of-kin/${journeyId}`)
    }
  }
}
