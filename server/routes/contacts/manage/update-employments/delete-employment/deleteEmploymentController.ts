import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import { UpdateEmploymentJourneyParams } from '../../../../../@types/journeys'
import Permission from '../../../../../enumeration/permission'

export default class DeleteEmploymentController implements PageHandler {
  public PAGE_NAME = Page.MANAGE_CONTACT_DELETE_EMPLOYMENT_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<UpdateEmploymentJourneyParams>, res: Response) => {
    const { prisonerNumber, contactId, employmentIdx, journeyId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!
    const employment = journey.employments[Number(employmentIdx) - 1]

    return res.render('pages/contacts/manage/employments/deleteEmployment/index', {
      navigation: {
        backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${journeyId}`,
      },
      contactNames: journey.contactNames,
      employment,
    })
  }

  POST = async (req: Request<UpdateEmploymentJourneyParams>, res: Response) => {
    const { prisonerNumber, contactId, employmentIdx, journeyId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!

    const idx = Number(employmentIdx) - 1

    if (journey.employments[idx]!.employmentId) {
      journey.employmentIdsToDelete ??= []
      journey.employmentIdsToDelete.push(journey.employments[idx]!.employmentId)
    }
    journey.employments.splice(idx, 1)

    return res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${journeyId}`)
  }
}
