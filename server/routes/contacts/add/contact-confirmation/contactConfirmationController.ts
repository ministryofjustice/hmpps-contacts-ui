import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { IsContactConfirmedSchema } from './contactConfirmationSchema'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { ContactsService } from '../../../../services'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { formatNameLastNameFirst } from '../../../../utils/formatName'
import ReferenceDataService from '../../../../services/referenceDataService'
import { findMostRelevantAddress, getLabelForAddress } from '../../../../utils/findMostRelevantAddressAndLabel'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import ContactDetails = contactsApiClientTypes.ContactDetails
import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails
import sortGlobalRestrictions from '../../../../utils/sortGlobalRstrictions'

export default class ContactConfirmationController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CONTACT_CONFIRMATION_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams, unknown, unknown, { contactId?: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { prisonerDetails, user } = res.locals
    const journey = req.session.addContactJourneys[journeyId]
    const contact: ContactDetails = await this.contactsService.getContact(journey.contactId, user)
    const globalRestrictionsEnriched = await this.getGlobalRestrictionsEnriched(contact, user)
    const globalRestrictions = sortGlobalRestrictions(globalRestrictionsEnriched)

    const formattedFullName = await this.formattedFullName(contact, user)
    const mostRelevantAddress = findMostRelevantAddress(contact)
    const mostRelevantAddressLabel = getLabelForAddress(mostRelevantAddress)
    return res.render('pages/contacts/manage/contactConfirmation/confirmation', {
      contact,
      globalRestrictions,
      formattedFullName,
      prisonerDetails,
      journey,
      mostRelevantAddress,
      mostRelevantAddressLabel,
      isContactConfirmed: res.locals?.formResponses?.isContactConfirmed ?? journey?.isContactConfirmed,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    })
  }

  private async getGlobalRestrictionsEnriched(
    contact: ContactDetails,
    user: Express.User,
  ): Promise<ContactRestrictionDetails[]> {
    const globalRestrictions: ContactRestrictionDetails[] = await this.contactsService.getGlobalContactRestrictions(
      contact.id,
      user,
    )

    return this.enrichRestrictionTitle(globalRestrictions)
  }

  private enrichRestrictionTitle(globalRestrictions: ContactRestrictionDetails[]): ContactRestrictionDetails {
    return globalRestrictions.map(item => {
      const expiry = new Date(item.expiryDate)
      const now = new Date()

      if (expiry < now) {
        return {
          ...item,
          restrictionTypeDescription: `${item.restrictionTypeDescription} (Expired)`,
        }
      }

      return item
    })
  }

  POST = async (req: Request<{ journeyId: string }, IsContactConfirmedSchema>, res: Response): Promise<void> => {
    const { isContactConfirmed } = req.body
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]

    if (isContactConfirmed === 'YES') {
      journey.isContactConfirmed = isContactConfirmed
      return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
    }
    journey.isContactConfirmed = undefined
    return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}`)
  }

  private async formattedFullName(contact: ContactDetails, user: Express.User) {
    let titleDescription: string
    if (contact.title) {
      titleDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.TITLE,
        contact.title,
        user,
      )
    }
    return formatNameLastNameFirst(contact, { customTitle: titleDescription })
  }
}
