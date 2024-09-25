import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { navigationForAddContactJourney } from '../addContactFlowControl'

export default class CreateContactCheckAnswersController implements PageHandler {
  constructor(
    private readonly contactService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    journey.isCheckingAnswers = true
    journey.previousAnswers = {
      names: journey.names,
      dateOfBirth: journey.dateOfBirth,
      relationship: journey.relationship,
    }
    let dateOfBirth
    if (journey.dateOfBirth.isKnown === 'YES') {
      dateOfBirth = new Date(`${journey.dateOfBirth.year}-${journey.dateOfBirth.month}-${journey.dateOfBirth.day}Z`)
    }

    const relationshipDescription = await this.referenceDataService.getReferenceDescriptionForCode(
      ReferenceCodeType.RELATIONSHIP,
      journey.relationship.type,
      user,
    )

    const view = {
      journey,
      dateOfBirth,
      relationshipDescription,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/checkAnswers', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    await this.contactService.createContact(journey, user).then(() => delete req.session.addContactJourneys[journeyId])
    res.redirect(journey.returnPoint.url)
  }
}
