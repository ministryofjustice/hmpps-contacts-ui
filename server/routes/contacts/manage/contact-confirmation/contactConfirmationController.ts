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
      logger.info(JSON.stringify(contact))
    } catch (error) {
      logger.info(JSON.stringify(error))
    }
    // contact.addresses = [
    //   {
    //     contactAddressId: 2,
    //     contactId: 1,
    //     addressType: 'WORK',
    //     addressTypeDescription: 'Work address',
    //     primaryAddress: true,
    //     flat: 'Flat 1',
    //     property: '42',
    //     street: 'My Work Place',
    //     area: 'Bunting',
    //     cityCode: '25343',
    //     cityDescription: "Sheffield",
    //     countyCode: "S.YORKSHIRE",
    //     countyDescription: "South Yorkshire",
    //     postcode: "S2 3LK",
    //     countryCode: "ENG",
    //     countryDescription: "England",
    //     verified: true,
    //     verifiedBy: "BOB",
    //     verifiedTime: "2020-01-01T10:30:00",
    //     mailFlag: true,
    //     startDate: "2020-01-02",
    //     endDate: "2029-03-04",
    //     noFixedAddress: true,
    //     phoneNumbers: [],
    //     createdBy: "TIM",
    //     createdTime: "2024-10-08T15:22:59.604791",
    //     amendedBy: null,
    //     amendedTime: null
    //   }
    // ]
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
