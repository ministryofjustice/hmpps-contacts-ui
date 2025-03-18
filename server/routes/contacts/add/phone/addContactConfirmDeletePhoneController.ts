import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class AddContactConfirmDeletePhoneController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_CONTACT_DELETE_PHONE_PAGE

  GET = async (
    req: Request<PrisonerJourneyParams & { index: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, index } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const phoneToRemove = journey.phoneNumbers?.[Number(index)]
    if (!phoneToRemove) {
      throw new Error(`Couldn't find a phone at index ${index}`)
    }
    const view = {
      journey,
      isNewContact: true,
      phone: {
        phoneNumber: phoneToRemove.phoneNumber,
        extNumber: phoneToRemove.extension,
        phoneTypeDescription: await this.referenceDataService.getReferenceDescriptionForCode(
          ReferenceCodeType.PHONE_TYPE,
          phoneToRemove.type,
          user,
        ),
      },
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/manage/contactMethods/confirmDeletePhone', view)
  }

  POST = async (req: Request<PrisonerJourneyParams & { index: string }>, res: Response): Promise<void> => {
    const { journeyId, index } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const indexNumber = Number(index)
    if (journey.phoneNumbers && indexNumber <= journey.phoneNumbers.length - 1) {
      journey.phoneNumbers.splice(indexNumber, 1)
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
