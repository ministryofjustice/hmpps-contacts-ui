import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import { setPaginationLocals } from '../../../../../views/partials/simplePagination/utils'
import OrganisationsService from '../../../../../services/organisationsService'
import { OrganisationSummaryResultItemPage } from '../../../../../@types/organisationsApiClient'
import { PrisonerJourneyParams, UpdateEmploymentJourneyParams } from '../../../../../@types/journeys'
import Permission from '../../../../../enumeration/permission'

export default class OrganisationSearchController implements PageHandler {
  constructor(private readonly organisationsService: OrganisationsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_SEARCH_ORGANISATION_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

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
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/organisation-search/${journeyId}#pagination`,
      )
    }
    if (page) {
      const pageNumber = Number(page)
      journey.organisationSearch.page = Number.isNaN(pageNumber) ? 1 : pageNumber
      return res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/organisation-search/${journeyId}#pagination`,
      )
    }

    let searchResult: OrganisationSummaryResultItemPage | undefined

    if (journey.organisationSearch.searchTerm) {
      searchResult = await this.organisationsService.searchOrganisations(
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

    return res.render('pages/contacts/manage/employments/organisationSearch/index', {
      navigation: {
        backLinkLabel: 'Back to employment information',
        backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${journeyId}`,
      },
      baseEmploymentLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/`,
      ...req.params,
      contact: journey.contactNames,
      organisationName: journey.organisationSearch.searchTerm,
      organisations: searchResult?.content ?? [],
      sort: journey.organisationSearch.sort,
    })
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, { organisationName?: string }>, res: Response) => {
    const journey = req.session.updateEmploymentsJourneys![req.params.journeyId]!
    journey.organisationSearch.searchTerm = req.body.organisationName ?? ''
    journey.organisationSearch.page = 1
    res.redirect(req.originalUrl)
  }
}
