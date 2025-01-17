import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { formatNameLastNameFirst } from '../../../../utils/formatName'
import ContactCreationResult = contactsApiClientTypes.ContactCreationResult
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import captionForAddContactJourney from '../addContactsUtils'

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
      journey.relationship.relationshipType === 'S'
        ? ReferenceCodeType.SOCIAL_RELATIONSHIP
        : ReferenceCodeType.OFFICIAL_RELATIONSHIP,
      journey.relationship.relationshipToPrisoner,
      user,
    )

    const formattedFullName = await this.formattedFullName(journey, user)

    const view = {
      journey,
      caption: captionForAddContactJourney(journey),
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
        .then((createdContact: ContactCreationResult) => {
          journey.contactId = createdContact.createdContact.id
          journey.prisonerContactId = createdContact.createdRelationship.prisonerContactId
        })
        .then(() => delete req.session.addContactJourneys[journeyId])
    } else if (journey.mode === 'EXISTING') {
      await this.contactService
        .addContact(journey, user)
        .then((createdContact: PrisonerContactRelationshipDetails) => {
          journey.prisonerContactId = createdContact.prisonerContactId
        })
        .then(() => delete req.session.addContactJourneys[journeyId])
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
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
    return formatNameLastNameFirst(journey.names, { customTitle: titleDescription })
  }
}
