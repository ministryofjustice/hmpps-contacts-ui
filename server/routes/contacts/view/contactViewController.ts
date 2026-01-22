import { Request, Response } from 'express'
import { ContactsService, PrisonerSearchService, RestrictionsService } from '../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import ReferenceDataService from '../../../services/referenceDataService'
import { Page } from '../../../services/auditService'
import Permission from '../../../enumeration/permission'
import { PrisonerJourneyParams } from '../../../@types/journeys'
import { ContactDetails } from '../../../@types/contactsApiClient'
import { setPaginationLocals } from '../../../views/partials/simplePagination/utils'
import { getReferenceDataOrderDictionary } from '../../../utils/sortPhoneNumbers'
import ReferenceCodeType from '../../../enumeration/referenceCodeType'
import { Prisoner } from '../../../data/prisonerOffenderSearchTypes'
import logger from '../../../../logger'

export default class ContactViewController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly prisonerSearchService: PrisonerSearchService,
  ) {}

  public PAGE_NAME = Page.DIRECT_CONTACT_VIEW_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

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
    const journey = req.session.searchContactJourneys![journeyId]!
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

    const prisonerContactIds = linkedPrisoners.content?.flatMap(prisoner => prisoner.prisonerContactId ?? []) ?? []

    const contactRelationshipRestrictions = (
      await Promise.all(
        prisonerContactIds.map(async prisonerContactId => {
          if (!prisonerContactId) return undefined

          const { prisonerContactRestrictions } = await this.restrictionsService.getRelationshipAndGlobalRestrictions(
            Number(prisonerContactId),
            user,
          )

          // skip when there are no restrictions
          if (!prisonerContactRestrictions || prisonerContactRestrictions.length === 0) {
            logger.info('No relationship restrictions found for prisonerContactId: ', prisonerContactId)
            return undefined
          }

          const prisonerNumber = prisonerContactRestrictions[0]?.prisonerNumber
          let prisonerDetails: { prisonerNumber: string; lastName: string; firstName: string } | undefined

          if (prisonerNumber) {
            const prisoner: Prisoner | undefined = await this.prisonerSearchService.getByPrisonerNumber(
              prisonerNumber,
              user,
            )

            if (prisoner) {
              prisonerDetails = {
                prisonerNumber: prisoner.prisonerNumber,
                lastName: prisoner.lastName,
                firstName: prisoner.firstName,
              }
            }
          }

          return {
            prisonerContactRestrictions,
            prisonerDetails,
          }
        }),
      )
    ).filter(r => r !== undefined)

    return res.render('pages/contacts/view/directContactView', {
      contact,
      prisonerContactRestrictions: contactRelationshipRestrictions,
      navigation: {
        backLinkLabel: 'Back to search results',
        backLink: `/direct/contacts/search/${journey.id}`,
      },
      globalRestrictions,
      linkedPrisoners: linkedPrisoners.content,
      linkedPrisonersCount,
      journey,
      phoneTypeOrderDictionary: getReferenceDataOrderDictionary(
        await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user),
      ),
    })
  }
}
