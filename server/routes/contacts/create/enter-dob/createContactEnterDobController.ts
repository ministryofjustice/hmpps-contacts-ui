import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { CreateContactEnterDobSchemaType } from './createContactEnterDobSchemas'

export default class CreateContactEnterDobController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_DOB_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    res.render('pages/contacts/create/enterDob', { journey })
  }

  POST = async (
    req: Request<{ journeyId: string }, unknown, CreateContactEnterDobSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const { body } = req
    if (body.isDobKnown) {
      journey.dateOfBirth = {
        isKnown: body.isDobKnown,
        dateOfBirth: body.dateOfBirth,
      }
    } else {
      journey.dateOfBirth = {
        isKnown: body.isDobKnown,
      }
    }
    res.redirect(`/contacts/create/check-answers/${journeyId}`)
  }
}
