import { Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import { CreateContactEmploymentParam, getEmploymentAndUrl } from '../common/utils'

export default class CreateContactDeleteEmploymentController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_DELETE_EMPLOYMENT_PAGE

  GET = async (req: Request<CreateContactEmploymentParam>, res: Response) => {
    const { journey, employment, bounceBackUrl } = getEmploymentAndUrl(req)

    if (employment === undefined) {
      throw new NotFound()
    }

    return res.render('pages/contacts/manage/employments/deleteEmployment/index', {
      isNewContact: true,
      navigation: {
        backLink: bounceBackUrl,
      },
      journey,
      contactNames: journey.names,
      employment,
    })
  }

  POST = async (req: Request<CreateContactEmploymentParam>, res: Response) => {
    const { journey, employment, bounceBackUrl } = getEmploymentAndUrl(req)
    journey.pendingEmployments = journey.pendingEmployments!.filter(itm => itm !== employment)
    return res.redirect(bounceBackUrl)
  }
}
