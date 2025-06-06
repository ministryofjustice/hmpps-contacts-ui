import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { OptionalDobSchemaType } from './enterDobSchemas'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class CreateContactEnterDobController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_DOB_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<{ journeyId: string }>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    const view = {
      isNewContact: true,
      contact: journey.names,
      journey,
      day: res.locals?.formResponses?.['day'] ?? journey?.dateOfBirth?.day,
      month: res.locals?.formResponses?.['month'] ?? journey?.dateOfBirth?.month,
      year: res.locals?.formResponses?.['year'] ?? journey?.dateOfBirth?.year,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
    }
    res.render('pages/contacts/manage/contactDetails/manageDob', view)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, OptionalDobSchemaType>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    const { day, month, year } = req.body
    if (day && month && year) {
      journey.dateOfBirth = {
        isKnown: 'YES',
        day,
        month,
        year,
      }
    } else {
      journey.dateOfBirth = {
        isKnown: 'NO',
      }
    }
    // Remove possible existing records on DOB change to re-trigger search for existing records
    delete journey.possibleExistingRecords
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
  }
}
