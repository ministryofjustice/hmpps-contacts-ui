import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { IsContactConfirmedSchema } from './contactConfirmationSchema'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { ContactsService, RestrictionsService } from '../../../../services'
import { formatNameLastNameFirst } from '../../../../utils/formatName'
import { findMostRelevantAddress, getLabelForAddress } from '../../../../utils/findMostRelevantAddressAndLabel'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import ContactDetails = contactsApiClientTypes.ContactDetails
import { setPaginationLocals } from '../../../../views/partials/simplePagination/utils'

export default class ContactConfirmationController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.CONTACT_CONFIRMATION_PAGE

  private LINKED_PRISONER_ITEMS_PER_PAGE = 10

  GET = async (
    req: Request<PrisonerJourneyParams, unknown, unknown, { linkedPrisonerPage?: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { prisonerDetails, user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const contact: ContactDetails = await this.contactsService.getContact(journey.contactId!, user)
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

    const formattedFullName = await formatNameLastNameFirst(contact, { customTitle: contact.titleDescription })
    const mostRelevantAddress = findMostRelevantAddress(contact, false)
    const mostRelevantAddressLabel = getLabelForAddress(mostRelevantAddress)
    return res.render('pages/contacts/manage/contactConfirmation/confirmation', {
      contact,
      linkedPrisoners: linkedPrisoners.content,
      linkedPrisonersCount,
      globalRestrictions,
      formattedFullName,
      prisonerDetails,
      journey,
      mostRelevantAddress,
      mostRelevantAddressLabel,
      isContactConfirmed: res.locals?.formResponses?.['isContactConfirmed'] ?? journey?.isContactConfirmed,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    })
  }

  POST = async (req: Request<{ journeyId: string }, IsContactConfirmedSchema>, res: Response): Promise<void> => {
    const { isContactConfirmed } = req.body
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    if (isContactConfirmed === 'YES') {
      journey.isContactConfirmed = isContactConfirmed
      return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
    }
    delete journey.isContactConfirmed
    return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}`)
  }
}
