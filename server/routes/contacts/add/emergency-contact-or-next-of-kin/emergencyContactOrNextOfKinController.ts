import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import captionForAddContactJourney from '../addContactsUtils'
import { OptionalEmergencyContactOrNextOfKinSchemaType } from '../../manage/relationship/emergency-contact-or-next-of-kin/manageEmergencyContactOrNextOfKinSchema'

export default class EmergencyContactOrNextOfKinController implements PageHandler {
  public PAGE_NAME = Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const view = {
      isOptional: true,
      caption: captionForAddContactJourney(journey),
      contact: journey.names,
      continueButtonLabel: 'Continue',
      emergencyContact: journey.relationship?.isEmergencyContact,
      nextOfKin: journey.relationship?.isNextOfKin,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/manage/contactDetails/relationship/manageNextOfKinAndEmergencyContact', view)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, OptionalEmergencyContactOrNextOfKinSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { emergencyContact, nextOfKin } = req.body
    journey.relationship!.isEmergencyContact = emergencyContact
    journey.relationship!.isNextOfKin = nextOfKin
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
