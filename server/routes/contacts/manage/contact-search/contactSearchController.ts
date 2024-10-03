import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactSearchSchemaType } from './contactSearchSchema'
import { ContactsService } from '../../../../services'
import { PaginationRequest } from '../../../../data/prisonerOffenderSearchTypes'
import { formatDateForApi } from '../../../../utils/utils'
import config from '../../../../config'
import { navigationForAddContactJourney } from '../../add/addContactFlowControl'
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import ContactSearchResultItemPage = contactsApiClientTypes.ContactSearchResultItemPage

export default class ContactSearchController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.CONTACT_SEARCH_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { prisonerDetails, user } = res.locals
    const journey = req.session.addContactJourneys[journeyId]
    const validationErrors = res.locals.validationErrors?.search
    const page = Number(req.query.page as unknown) || 0
    const pageSize = config.apis.contactsApi.pageSize || 10
    let results = null

    if (journey?.searchContact) {
      const contactSearchRequest: ContactSearchRequest = {
        lastName: journey?.searchContact?.contact.lastName,
        firstName: journey?.searchContact?.contact.firstName,
        middleName: journey?.searchContact?.contact.middleName,
        dateOfBirth: formatDateForApi(journey?.searchContact?.dateOfBirth),
      }

      results = validationErrors
        ? ({ totalPages: 0, totalElements: 0, content: [] } as ContactSearchResultItemPage)
        : await this.contactsService.searchContact(
            contactSearchRequest,
            { page, size: pageSize } as PaginationRequest,
            user,
          )
    }
    const view = {
      prisonerDetails,
      lastName: res.locals?.formResponses?.lastName ?? journey?.searchContact?.contact.lastName,
      firstName: res.locals?.formResponses?.firstName ?? journey?.searchContact?.contact.firstName,
      middleName: res.locals?.formResponses?.middleName ?? journey?.searchContact?.contact.middleName,
      day: res.locals?.formResponses?.day ?? journey?.searchContact?.dateOfBirth?.day,
      month: res.locals?.formResponses?.month ?? journey?.searchContact?.dateOfBirth?.month,
      year: res.locals?.formResponses?.year ?? journey?.searchContact?.dateOfBirth?.year,
    }
    const navigation = navigationForAddContactJourney(this.PAGE_NAME, journey)
    res.render('pages/contacts/manage/contactSearch', { view, journey, results, navigation })
  }

  POST = async (req: Request<{ journeyId: string }, ContactSearchSchemaType>, res: Response): Promise<void> => {
    const { lastName, firstName, middleName, day, month, year } = req.body
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys[journeyId]
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

    res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}`)
  }
}
