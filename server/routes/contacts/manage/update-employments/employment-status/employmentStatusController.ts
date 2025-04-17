import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import { IsActiveEmploymentSchema } from './employmentStatusSchema'
import { UpdateEmploymentJourneyParams } from '../../../../../@types/journeys'

export default class EmploymentStatusController implements PageHandler {
  public PAGE_NAME = Page.MANAGE_CONTACT_EMPLOYMENT_STATUS_PAGE

  GET = async (req: Request<UpdateEmploymentJourneyParams>, res: Response) => {
    const { prisonerNumber, contactId, employmentIdx, journeyId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!
    const employment = journey.employments[Number(employmentIdx) - 1]!

    return res.render('pages/contacts/manage/employments/employmentStatus/index', {
      navigation: {
        backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${journeyId}`,
      },
      contactNames: journey.contactNames,
      employerName: employment.employer.organisationName,
      isActive: employment.isActive,
    })
  }

  POST = async (req: Request<UpdateEmploymentJourneyParams, unknown, IsActiveEmploymentSchema>, res: Response) => {
    const { prisonerNumber, contactId, employmentIdx, journeyId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!

    journey.employments[Number(employmentIdx) - 1]!.isActive = req.body.isActive

    return res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${journeyId}`)
  }
}
