import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { navigationForAddContactJourney } from '../addContactFlowControl'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import formatName from '../../../../utils/formatName'

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

    const formattedFullName = await this.formattedFullName(journey, user)

    const view = {
      journey,
      dateOfBirth,
      relationshipDescription,
      formattedFullName,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/checkAnswers', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    if (journey.mode === 'NEW') {
      await this.contactService
        .createContact(journey, user)
        .then(() => delete req.session.addContactJourneys[journeyId])
    } else if (journey.mode === 'EXISTING') {
      await this.contactService.addContact(journey, user).then(() => delete req.session.addContactJourneys[journeyId])
    }
    res.redirect(journey.returnPoint.url)
  }

  private async formattedFullName(journey: journeys.AddContactJourney, user: Express.User) {
    let titleDescription: string
    if (journey.names.title) {
      titleDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.TITLE,
        journey.names.title,
        user,
      )
    }
    return formatName(journey.names, { customTitle: titleDescription })
  }
}
