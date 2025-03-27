import { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import { IsActiveEmploymentSchema } from '../../../manage/update-employments/employment-status/employmentStatusSchema'
import { CreateContactEmploymentParam, getEmploymentAndUrl } from '../common/utils'

export default class CreateContactEmploymentStatusController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_EMPLOYMENT_STATUS_PAGE

  GET = async (req: Request<CreateContactEmploymentParam>, res: Response) => {
    const { journey, employment, bounceBackUrl } = getEmploymentAndUrl(req)

    if (employment === undefined) {
      throw new NotFound()
    }

    return res.render('pages/contacts/manage/employments/employmentStatus/index', {
      isNewContact: true,
      journey,
      navigation: { backLink: bounceBackUrl },
      contactNames: journey.names,
      employerName: employment.employer.organisationName,
      isActive: employment.isActive,
    })
  }

  POST = async (req: Request<CreateContactEmploymentParam, unknown, IsActiveEmploymentSchema>, res: Response) => {
    const { employment, bounceBackUrl } = getEmploymentAndUrl(req)
    employment!.isActive = req.body.isActive
    return res.redirect(bounceBackUrl)
  }
}
