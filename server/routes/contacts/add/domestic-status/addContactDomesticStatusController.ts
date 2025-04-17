import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { PrisonerJourneyParams } from '../../../../@types/journeys'

export default class AddContactDomesticStatusController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const domesticStatusOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.DOMESTIC_STS, user)
    const view = {
      journey,
      domesticStatusOptions,
      isNewContact: true,
      domesticStatusCode: res.locals?.formResponses?.['domesticStatusCode'] ?? journey?.domesticStatusCode,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/manage/contactDetails/domesticStatus', view)
  }

  POST = async (
    req: Request<
      PrisonerJourneyParams,
      unknown,
      {
        domesticStatusCode?: string | undefined
      }
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { body } = req
    journey.domesticStatusCode = body.domesticStatusCode
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
