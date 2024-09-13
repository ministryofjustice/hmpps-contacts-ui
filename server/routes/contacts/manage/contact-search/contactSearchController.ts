import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactSearchSchemaType } from './contactSearchSchema'
import { PrisonerSearchService } from '../../../../services'

export default class ContactSearchController implements PageHandler {
  constructor(private readonly prisonerSearchService: PrisonerSearchService) {}

  public PAGE_NAME = Page.CONTACT_SEARCH_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId, prisonerNumber } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]

    const prisonerDetails = await this.prisonerSearchService.getByPrisonerNumber(prisonerNumber as string, user)

    const viewModel = {
      journey,
      lastName: res.locals?.formResponses?.lastName ?? journey?.searchContact?.contact.lastName,
      firstName: res.locals?.formResponses?.firstName ?? journey?.searchContact?.contact.firstName,
      middleName: res.locals?.formResponses?.middleName ?? journey?.searchContact?.contact.middleName,
      day: res.locals?.formResponses?.day ?? journey?.searchContact?.dateOfBirth?.day,
      month: res.locals?.formResponses?.month ?? journey?.searchContact?.dateOfBirth?.month,
      year: res.locals?.formResponses?.year ?? journey?.searchContact?.dateOfBirth?.year,
    }

    res.render('pages/contacts/manage/contactSearch', { viewModel, prisonerDetails, journey })
  }

  POST = async (req: Request<{ journeyId: string }, ContactSearchSchemaType>, res: Response): Promise<void> => {
    const { lastName, firstName, middleName, day, month, year } = req.body
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]
    journey.searchContact = {
      contact: {
        lastName,
        middleName,
        firstName,
      },
      dateOfBirth: {
        day,
        month,
        year,
      },
    }

    res.redirect(`/prisoner/${journey.prisoner.prisonerNumber}/contacts/search/${journeyId}`)
  }
}
