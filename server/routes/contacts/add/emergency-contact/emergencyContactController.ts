import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { EmergencyContactSchema } from './emergencyContactSchemas'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import captionForAddContactJourney from '../addContactsUtils'

export default class EmergencyContactController implements PageHandler {
  public PAGE_NAME = Page.SELECT_EMERGENCY_CONTACT

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const view = {
      journey,
      caption: captionForAddContactJourney(journey),
      isEmergencyContact: res.locals?.formResponses?.isEmergencyContact ?? journey?.relationship?.isEmergencyContact,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/selectEmergencyContact', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, EmergencyContactSchema>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const { body } = req
    journey.relationship.isEmergencyContact = body.isEmergencyContact
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
