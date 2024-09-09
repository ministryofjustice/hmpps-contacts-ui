import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { CreateContactEnterDobSchemaType } from './createContactEnterDobSchemas'
import DateOfBirth = journeys.DateOfBirth

export default class CreateContactEnterDobController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_DOB_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
    const view = {
      journey,
      isKnown: res.locals?.formResponses?.isKnown ?? journey?.dateOfBirth?.isKnown,
      day: res.locals?.formResponses?.day ?? journey?.dateOfBirth?.day,
      month: res.locals?.formResponses?.month ?? journey?.dateOfBirth?.month,
      year: res.locals?.formResponses?.year ?? journey?.dateOfBirth?.year,
    }
    res.render('pages/contacts/create/enterDob', view)
  }

  POST = async (
    req: Request<{ journeyId: string }, unknown, CreateContactEnterDobSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]
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
    if (journey.dateOfBirth.isKnown === 'YES') {
      res.redirect(`/contacts/create/check-answers/${journeyId}`)
    } else {
      res.redirect(`/contacts/create/enter-estimated-dob/${journeyId}`)
    }
  }
}
