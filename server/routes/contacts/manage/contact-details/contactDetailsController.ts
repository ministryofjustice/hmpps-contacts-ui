import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import formatName from '../../../../utils/formatName'
import ManageContactsJourney = journeys.ManageContactsJourney
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import Contact = contactsApiClientTypes.Contact
import GetContactResponse = contactsApiClientTypes.GetContactResponse
import logger from '../../../../../logger'

export default class ContactDetailsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CONTACT_DETAILS_PAGE

  GET = async (
    // req: Request<PrisonerJourneyParams, unknown, unknown, { contactId?: string }>,
    req: Request<PrisonerJourneyParams, { journeyId?: string; contactId?: string }, unknown>,
    res: Response,
  ): Promise<void> => {
    let journey: ManageContactsJourney
    const { journeyId, contactId } = req.params
    const { prisonerDetails, user } = res.locals
    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const formattedFullName = await this.formattedFullName(contact, user)
    logger.info(JSON.stringify(formattedFullName))

    if (journeyId) {
      journey = req.session.manageContactsJourneys[journeyId]
      journey.prisoner = {
        firstName: prisonerDetails?.firstName,
        lastName: prisonerDetails?.lastName,
        prisonerNumber: prisonerDetails?.prisonerNumber,
        dateOfBirth: prisonerDetails?.dateOfBirth,
        prisonName: prisonerDetails?.prisonName,
      }

      logger.info(JSON.stringify(contact))
    }

    return res.render('pages/contacts/manage/contactDetails', {
      contact,
      prisonerDetails,
      formattedFullName,
      // journey,
      // isContactConfirmed: res.locals?.formResponses?.isContactConfirmed ?? journey?.isContactConfirmed,
      // navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    })
  }

  private async formattedFullName(contact: GetContactResponse, user: Express.User) {
    let titleDescription: string
    if (contact.title) {
      titleDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.TITLE,
        contact.title,
        user,
      )
    }
    return formatName(contact, { customTitle: titleDescription })
  }
}
