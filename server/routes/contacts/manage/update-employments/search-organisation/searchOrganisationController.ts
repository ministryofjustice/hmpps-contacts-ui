import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import UpdateEmploymentJourneyParams = journeys.UpdateEmploymentJourneyParams
import { ContactsService } from '../../../../../services'
import OrganisationSummaryResultItemPage = contactsApiClientTypes.OrganisationSummaryResultItemPage
import { setPaginationLocals } from '../../../../../views/partials/simplePagination/utils'

export default class SearchOrganisationController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_SEARCH_ORGANISATION_PAGE

  private TABLE_ROW_COUNT = 10

  GET = async (
    req: Request<UpdateEmploymentJourneyParams, unknown, unknown, { page?: string; sort?: string }>,
    res: Response,
  ) => {
    const { prisonerNumber, contactId, employmentIdx, journeyId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!
    const { page, sort } = req.query

    if (sort) {
      journey.organisationSearch.sort = sort
      journey.organisationSearch.page = 1
      return res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/search-organisation/${journeyId}`,
      )
    }
    if (page) {
      const pageNumber = Number(page)
      journey.organisationSearch.page = Number.isNaN(pageNumber) ? 0 : pageNumber
      return res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/search-organisation/${journeyId}`,
      )
    }

    let searchResult: OrganisationSummaryResultItemPage | undefined

    if (journey.organisationSearch.searchTerm) {
      searchResult = await this.contactsService.searchOrganisations(
        {
          searchTerm: journey.organisationSearch.searchTerm,
          page: journey.organisationSearch.page - 1,
          size: this.TABLE_ROW_COUNT,
          sort: [journey.organisationSearch.sort ?? 'organisationName,asc'],
        },
        res.locals.user,
      )
      setPaginationLocals(
        res,
        this.TABLE_ROW_COUNT,
        journey.organisationSearch.page,
        searchResult?.totalElements ?? 0,
        searchResult?.content?.length ?? 0,
      )
    }

    return res.render('pages/contacts/manage/updateEmployments/searchOrganisation/index', {
      organisationName: journey.organisationSearch.searchTerm ?? '',
      organisations: searchResult?.content ?? [],
      sort: journey.organisationSearch.sort,
    })
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, { organisationName?: string }>, res: Response) => {
    const journey = req.session.updateEmploymentsJourneys![req.params.journeyId]!
    if (req.body.organisationName) {
      journey.organisationSearch.searchTerm = req.body.organisationName
    } else {
      delete journey.organisationSearch.searchTerm
    }
    journey.organisationSearch.page = 1
    res.redirect(req.originalUrl)
  }
}
