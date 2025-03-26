import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { IsContactConfirmedSchema } from './contactConfirmationSchema'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { ContactsService, RestrictionsService } from '../../../../services'
import { formatNameLastNameFirst } from '../../../../utils/formatName'
import { findMostRelevantAddress, getLabelForAddress } from '../../../../utils/findMostRelevantAddressAndLabel'
import sortRestrictions from '../../../../utils/sortGlobalRstrictions'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import ContactDetails = contactsApiClientTypes.ContactDetails

export default class ContactConfirmationController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.CONTACT_CONFIRMATION_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams, unknown, unknown, { contactId?: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { prisonerDetails, user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const contact: ContactDetails = await this.contactsService.getContact(journey.contactId!, user)
    const globalRestrictionsEnriched = await this.restrictionsService.getGlobalRestrictionsEnriched(contact, user)
    const globalRestrictions = sortRestrictions(globalRestrictionsEnriched)

    const linkedPrisoners = await this.contactsService.getLinkedPrisoners(contact.id, user)

    const formattedFullName = await formatNameLastNameFirst(contact, { customTitle: contact.titleDescription })
    const mostRelevantAddress = findMostRelevantAddress(contact, false)
    const mostRelevantAddressLabel = getLabelForAddress(mostRelevantAddress)
    return res.render('pages/contacts/manage/contactConfirmation/confirmation', {
      contact,
      linkedPrisoners: linkedPrisoners.content,
      linkedPrisonersCount: linkedPrisoners.total,
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
