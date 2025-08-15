import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import ReferenceDataService from '../../../../services/referenceDataService'
import { formatAddresses } from './common/utils'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class AddAddressesController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_ADDRESSES

  public REQUIRED_PERMISSION = Permission.edit_contacts

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
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
    }
    res.render('pages/contacts/add/addresses/index', view)
  }

  POST = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals

    if (journey.pendingAddresses?.length) {
      journey.addresses = journey.pendingAddresses
    } else {
      delete journey.addresses
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
  }
}
