import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { ContactsService, RestrictionsService } from '../../../../services'
import { setPaginationLocals } from '../../../../views/partials/simplePagination/utils'
import { getReferenceDataOrderDictionary } from '../../../../utils/sortPhoneNumbers'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import { ContactDetails } from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'
import { PossibleExistingRecordMatchSchema } from './possibleExistingRecordMatchSchema'

export default class PossibleExistingRecordMatchController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.ADD_CONTACT_POSSIBLE_EXISTING_RECORD_MATCH_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  private LINKED_PRISONER_ITEMS_PER_PAGE = 10

  GET = async (
    req: Request<
      PrisonerJourneyParams & { matchingContactId: string },
      unknown,
      unknown,
      {
        linkedPrisonerPage?: string
      }
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId, matchingContactId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    journey.matchingContactId = Number(matchingContactId)

    const contact: ContactDetails = await this.contactsService.getContact(journey.matchingContactId, user)
    const globalRestrictions = await this.restrictionsService.getGlobalRestrictions(contact, user)

    const { linkedPrisonerPage } = req.query

    const linkedPrisonerPageNumber =
      linkedPrisonerPage && !Number.isNaN(Number(linkedPrisonerPage)) ? Number(linkedPrisonerPage) : 1

    const linkedPrisoners = await this.contactsService.getLinkedPrisoners(
      contact.id,
      linkedPrisonerPageNumber - 1,
      this.LINKED_PRISONER_ITEMS_PER_PAGE,
      user,
    )
    const linkedPrisonersCount = linkedPrisoners?.page?.totalElements ?? 0
    setPaginationLocals(
      res,
      this.LINKED_PRISONER_ITEMS_PER_PAGE,
      linkedPrisonerPageNumber,
      linkedPrisonersCount,
      linkedPrisoners?.content?.length ?? 0,
      '?linkedPrisonerPage={page}#linked-prisoners',
    )

    return res.render('pages/contacts/add/existing/matchPossibleExistingRecord', {
      contact,
      globalRestrictions,
      multipleMatches: journey.possibleExistingRecords && journey.possibleExistingRecords.length > 1,
      linkedPrisoners: linkedPrisoners.content,
      linkedPrisonersCount,
      isPossibleExistingRecordMatched:
        res.locals?.formResponses?.['isPossibleExistingRecordMatched'] ?? journey?.isPossibleExistingRecordMatched,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
      phoneTypeOrderDictionary: getReferenceDataOrderDictionary(
        await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user),
      ),
    })
  }

  POST = async (
    req: Request<{ journeyId: string }, PossibleExistingRecordMatchSchema>,
    res: Response,
  ): Promise<void> => {
    const { isPossibleExistingRecordMatched } = req.body
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    journey.isPossibleExistingRecordMatched = isPossibleExistingRecordMatched
    if (isPossibleExistingRecordMatched === 'YES') {
      journey.contactId = journey.matchingContactId!
    }
    return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
  }
}
