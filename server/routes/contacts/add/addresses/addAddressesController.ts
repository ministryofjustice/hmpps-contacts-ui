import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import ReferenceDataService from '../../../../services/referenceDataService'
import { formatAddresses } from './common/utils'

export default class AddAddressesController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_ADDRESSES

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    journey.pendingAddresses ??= journey.addresses
    delete journey.newAddress

    const view = {
      ...req.params,
      contact: journey.names,
      addresses: await formatAddresses(journey.pendingAddresses, this.referenceDataService, user),
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/addresses/index', view)
  }

  POST = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    if (journey.pendingAddresses?.length) {
      journey.addresses = journey.pendingAddresses
    } else {
      delete journey.addresses
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
