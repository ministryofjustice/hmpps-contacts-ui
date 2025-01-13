import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import DateOfBirth = journeys.DateOfBirth
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { EnterDobSchemaType } from '../../common/enter-dob/enterDobSchemas'

export default class CreateContactEnterDobController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_DOB_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const view = {
      journey,
      isKnown: res.locals?.formResponses?.isKnown ?? journey?.dateOfBirth?.isKnown,
      day: res.locals?.formResponses?.day ?? journey?.dateOfBirth?.day,
      month: res.locals?.formResponses?.month ?? journey?.dateOfBirth?.month,
      year: res.locals?.formResponses?.year ?? journey?.dateOfBirth?.year,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/common/enterDob', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, EnterDobSchemaType>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
    const { body } = req
    if (body.isKnown === 'YES') {
      journey.dateOfBirth = {
        isKnown: 'YES',
        day: body.day,
        month: body.month,
        year: body.year,
      } as DateOfBirth
    } else {
      journey.dateOfBirth = {
        isKnown: 'NO',
      } as DateOfBirth
    }

    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }
}
