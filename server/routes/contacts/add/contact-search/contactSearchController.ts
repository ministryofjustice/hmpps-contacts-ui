import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactSearchSchemaType } from './contactSearchSchema'
import { ContactsService } from '../../../../services'
import { formatDateForApi } from '../../../../utils/utils'
import { navigationForAddContactJourney } from '../addContactFlowControl'
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import PagedModelContactSearchResultItem = contactsApiClientTypes.PagedModelContactSearchResultItem
import { setPaginationLocals } from '../../../../views/partials/simplePagination/utils'

export default class ContactSearchController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.CONTACT_SEARCH_PAGE

  private TABLE_ROW_COUNT = 10

  GET = async (
    req: Request<{ journeyId: string }, unknown, unknown, { clear?: string; page?: string; sort?: string }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!

    if (journey.searchContact) {
      const { clear, sort, page } = req.query

      if (clear === 'filter') {
        delete journey.searchContact.dateOfBirth
        return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}`)
      }
      if (sort) {
        journey.searchContact.sort = sort
        journey.searchContact.page = 1
        return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}`)
      }
      if (page) {
        const pageNumber = Number(page)
        journey.searchContact.page = Number.isNaN(pageNumber) ? 1 : pageNumber
        return res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}`)
      }
    }

    const { day, month, year } = journey?.searchContact?.dateOfBirth ?? {}
    const hasDob = !!(day && month && year)
    const dobError =
      res.locals.validationErrors &&
      (res.locals?.formResponses?.['day'] ||
        res.locals?.formResponses?.['month'] ||
        res.locals?.formResponses?.['year'])

    let results: PagedModelContactSearchResultItem | undefined

    if (journey.searchContact?.contact?.lastName && !dobError) {
      const contactSearchRequest: ContactSearchRequest = {
        lastName: journey.searchContact.contact.lastName,
        firstName: journey.searchContact.contact.firstName,
        middleNames: journey.searchContact.contact.middleNames,
        dateOfBirth: formatDateForApi(journey.searchContact.dateOfBirth),
      }

      results = await this.contactsService.searchContact(
        contactSearchRequest,
        {
          page: (journey.searchContact.page ?? 1) - 1,
          size: this.TABLE_ROW_COUNT,
          sort: journey.searchContact.sort ?? 'lastName,asc',
        },
        user,
      )
      setPaginationLocals(
        res,
        this.TABLE_ROW_COUNT,
        journey.searchContact.page ?? 1,
        results?.page?.totalElements ?? 0,
        results?.content?.length ?? 0,
      )
    }

    const view = {
      lastName: res.locals?.formResponses?.['lastName'] ?? journey?.searchContact?.contact?.lastName,
      firstName: res.locals?.formResponses?.['firstName'] ?? journey?.searchContact?.contact?.firstName,
      middleNames: res.locals?.formResponses?.['middleNames'] ?? journey?.searchContact?.contact?.middleNames,
      day: res.locals?.formResponses?.['day'] ?? day,
      month: res.locals?.formResponses?.['month'] ?? month,
      year: res.locals?.formResponses?.['year'] ?? year,
      filter: dobError ? 'Filter cannot be applied' : hasDob && `${day}/${month}/${year}`,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
      sort: journey.searchContact?.sort,
      journey,
      results,
      dobError,
    }
    return res.render('pages/contacts/manage/contactSearch', view)
  }

  POST = async (req: Request<{ journeyId: string }, ContactSearchSchemaType>, res: Response): Promise<void> => {
    const { lastName, firstName, middleNames, day, month, year } = req.body
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    if (lastName || firstName || middleNames) {
      journey.searchContact = {
        contact: {
          lastName: lastName || undefined,
          middleNames: middleNames || undefined,
          firstName: firstName || undefined,
        },
        page: 1,
      }
    } else if (lastName === '' && firstName === '' && middleNames === '') {
      journey.searchContact = { page: 1 }
    } else if (day && month && year && journey.searchContact?.contact?.lastName) {
      journey.searchContact.dateOfBirth = { day, month, year }
      journey.searchContact.page = 1
      delete journey.searchContact.sort
    }
    res.redirect(`/prisoner/${journey.prisonerNumber}/contacts/search/${journeyId}`)
  }
}
