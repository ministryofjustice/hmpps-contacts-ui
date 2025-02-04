import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import { employmentSorter } from '../../../../utils/sorters'

export default class UpdateEmploymentsController implements PageHandler {
  public PAGE_NAME = Page.MANAGE_CONTACT_UPDATE_EMPLOYMENTS_PAGE

  GET = async (req: Request<PrisonerJourneyParams>, res: Response) => {
    const { journeyId } = req.params
    const { contactNames, employments, returnPoint } = req.session.updateEmploymentsJourneys![journeyId]!
    res.render('pages/contacts/manage/updateEmployments/index', {
      contactNames,
      employments: employments.sort(employmentSorter),
      returnPoint,
    })
  }

  POST = async (req: Request<PrisonerJourneyParams>, res: Response) => {
    const { journeyId } = req.params
    const { returnPoint } = req.session.updateEmploymentsJourneys![journeyId]!
    res.redirect(returnPoint.url)
  }
}
