import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { CreateContactEnterNameSchemaType } from './createContactEnterNameSchemas'

export default class EnterNameController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_NAME_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    res.render('pages/contacts/create/enterName', { journey })
  }

  POST = async (
    req: Request<
      {
        journeyId: string
      },
      unknown,
      CreateContactEnterNameSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { title, lastName, firstName, middleName } = req.body
    const journey = req.session.createContactJourneys[journeyId]
    journey.names = { title, lastName, firstName, middleName }
    res.redirect(`/contacts/create/enter-dob/${journeyId}`)
  }
}
