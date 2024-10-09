import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { IsContactConfirmedSchema } from './contactConfirmationSchema'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../../add/addContactFlowControl'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import Contact = contactsApiClientTypes.Contact
import { ContactsService } from '../../../../services'
import logger from '../../../../../logger'

export default class ContactConfirmationController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.CONTACT_CONFIRMATION_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams, unknown, unknown, { contactId?: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { prisonerDetails, user } = res.locals
    const journey = req.session.addContactJourneys[journeyId]
    const validationErrors = res.locals.validationErrors?.isContactConfirmed
    let contact: Contact

    try {
      contact = validationErrors ? null : await this.contactsService.getContact(journey.contactId, user)
    } catch (error) {
      logger.error(JSON.stringify(error))
    }

    return res.render('pages/contacts/manage/contactConfirmation/confirmation', {
      contact,
      prisonerDetails,
      journey,
      isContactConfirmed: res.locals?.formResponses?.isContactConfirmed ?? journey?.isContactConfirmed,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
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
}
