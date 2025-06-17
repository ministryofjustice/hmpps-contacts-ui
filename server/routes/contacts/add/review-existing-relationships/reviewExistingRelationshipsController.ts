import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney } from '../addContactFlowControl'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'
import { ContactsService } from '../../../../services'
import TelemetryService from '../../../../services/telemetryService'

export default class ReviewExistingRelationshipsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly telemetryService: TelemetryService,
    public PAGE_NAME: Page,
  ) {}

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<PrisonerJourneyParams & { matchingContactId: string }>, res: Response): Promise<void> => {
    const { journeyId, prisonerNumber, matchingContactId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const existingRelationships = await this.contactsService.getAllSummariesForPrisonerAndContact(
      prisonerNumber,
      Number(matchingContactId),
      user,
    )
    const viewModel = {
      journey,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
      existingRelationships,
      matchingContactId,
    }
    this.telemetryService.trackEvent('REVIEWING_EXISTING_RELATIONSHIPS', user, {
      journeyId,
      numberOfExistingRelationships: existingRelationships.length,
      prisonerNumber,
      matchingContactId,
    })
    res.render('pages/contacts/manage/contactDetails/relationship/reviewExistingRelationships', viewModel)
  }
}
