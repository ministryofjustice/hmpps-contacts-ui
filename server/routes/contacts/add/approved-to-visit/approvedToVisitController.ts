import { Request, Response } from 'express'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import captionForAddContactJourney from '../addContactsUtils'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'

export default class ApprovedToVisitController implements PageHandler {
  public PAGE_NAME = Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const viewModel = {
      isOptional: true,
      caption: captionForAddContactJourney(journey),
      continueButtonLabel: 'Continue',
      contact: journey.names,
      isApprovedVisitor: journey.relationship?.isApprovedVisitor,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/manage/contactDetails/relationship/manageApprovedToVisit', viewModel)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, { isApprovedToVisit?: 'YES' | 'NO' }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { isApprovedToVisit } = req.body
    journey.relationship ??= {}
    if (isApprovedToVisit) {
      journey.relationship.isApprovedVisitor = isApprovedToVisit === 'YES'
    } else {
      delete journey.relationship.isApprovedVisitor
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
