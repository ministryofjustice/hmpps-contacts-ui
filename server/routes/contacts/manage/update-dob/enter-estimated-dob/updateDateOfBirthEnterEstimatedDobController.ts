import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

import { EnterEstimatedDobSchemas } from '../../../common/enter-estimated-dob/enterEstimatedDobSchemas'
import { Navigation } from '../../../common/navigation'

export default class UpdateDateOfBirthEnterEstimatedDobController implements PageHandler {
  public PAGE_NAME = Page.UPDATE_CONTACT_DOB_ESTIMATED_DOB_PAGE

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.updateDateOfBirthJourneys[journeyId]
    const navigation: Navigation = {
      backLink: `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/update-dob/enter-dob/${journey.id}`,
    }
    const view = {
      journey,
      isOverEighteen: res.locals?.formResponses?.isOverEighteen ?? journey?.dateOfBirth?.isOverEighteen,
      navigation,
      continueButtonLabel: 'Confirm and save',
    }
    res.render('pages/contacts/common/enterEstimatedDob', view)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, EnterEstimatedDobSchemas>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.updateDateOfBirthJourneys[journeyId]
    const { body } = req
    journey.dateOfBirth.isOverEighteen = body.isOverEighteen
    res.redirect(
      `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/update-dob/complete/${journey.id}`,
    )
  }
}
