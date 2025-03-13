import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import captionForAddContactJourney from '../addContactsUtils'

export default class AddContactAdditionalInfoController implements PageHandler {
  public PAGE_NAME = Page.ENTER_ADDITIONAL_INFORMATION_PAGE

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const view = {
      journey,
      caption: captionForAddContactJourney(journey),
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/additionalInfo', view)
  }

  POST = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
