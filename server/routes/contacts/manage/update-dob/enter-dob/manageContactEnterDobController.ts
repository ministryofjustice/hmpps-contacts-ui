import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { EnterDobSchemaType } from '../../../common/enter-dob/enterDobSchemas'
import { Navigation } from '../../../common/navigation'
import DateOfBirth = journeys.DateOfBirth
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class ManageContactEnterDobController implements PageHandler {
  public PAGE_NAME = Page.UPDATE_CONTACT_DOB_ENTER_DOB_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.updateDateOfBirthJourneys[journeyId]
    const navigation: Navigation = {
      backLink: journey.returnPoint.url,
    }
    const view = {
      journey,
      isKnown: res.locals?.formResponses?.isKnown ?? journey?.dateOfBirth?.isKnown,
      day: res.locals?.formResponses?.day ?? journey?.dateOfBirth?.day,
      month: res.locals?.formResponses?.month ?? journey?.dateOfBirth?.month,
      year: res.locals?.formResponses?.year ?? journey?.dateOfBirth?.year,
      navigation,
    }
    res.render('pages/contacts/common/enterDob', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, EnterDobSchemaType>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.updateDateOfBirthJourneys[journeyId]
    const { body } = req
    if (body.isKnown === 'YES') {
      journey.dateOfBirth = {
        isKnown: 'YES',
        day: body.day,
        month: body.month,
        year: body.year,
      } as DateOfBirth
      res.redirect(
        `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/update-dob/complete/${journey.id}`,
      )
    } else {
      const existingIsOverEighteen = journey.dateOfBirth?.isOverEighteen
      journey.dateOfBirth = {
        isKnown: 'NO',
      } as DateOfBirth
      if (existingIsOverEighteen) {
        journey.dateOfBirth.isOverEighteen = existingIsOverEighteen
      }
      res.redirect(
        `/prisoner/${journey.prisonerNumber}/contacts/manage/${journey.contactId}/update-dob/enter-estimated-dob/${journey.id}`,
      )
    }
  }
}
