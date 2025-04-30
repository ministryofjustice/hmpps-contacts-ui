import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { PrisonerJourneyParams } from '../../../../@types/journeys'

export default class AddContactGenderController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_CONTACT_ENTER_GENDER_PAGE

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const genderOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.GENDER, user)
    const view = {
      journey,
      genderOptions,
      isNewContact: true,
      gender: res.locals?.formResponses?.['gender'] ?? journey?.gender,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
    }
    res.render('pages/contacts/manage/contactDetails/manageGender', view)
  }

  POST = async (
    req: Request<
      PrisonerJourneyParams,
      unknown,
      {
        gender?: string | undefined
      }
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    const { body } = req
    journey.gender = body.gender
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
  }
}
