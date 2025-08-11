import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import captionForAddContactJourney from '../addContactsUtils'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class AddContactAdditionalInfoController implements PageHandler {
  public PAGE_NAME = Page.ENTER_ADDITIONAL_INFORMATION_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals

    delete journey.pendingEmployments
    delete journey.pendingAddresses
    const view = {
      journey,
      caption: captionForAddContactJourney(journey),
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
    }
    res.render('pages/contacts/add/additionalInfo', view)
  }

  POST = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals

    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
  }
}
