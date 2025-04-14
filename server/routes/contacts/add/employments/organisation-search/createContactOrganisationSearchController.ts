import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import OrganisationSummaryResultItemPage = contactsApiClientTypes.OrganisationSummaryResultItemPage
import { setPaginationLocals } from '../../../../../views/partials/simplePagination/utils'
import OrganisationsService from '../../../../../services/organisationsService'
import { CreateContactEmploymentParam, getEmploymentAndUrl } from '../common/utils'

export default class CreateContactOrganisationSearchController implements PageHandler {
  constructor(private readonly organisationsService: OrganisationsService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_SEARCH_ORGANISATION_PAGE

  private TABLE_ROW_COUNT = 10

  GET = async (
    req: Request<CreateContactEmploymentParam, unknown, unknown, { page?: string; sort?: string }>,
    res: Response,
  ) => {
    const { journey, employmentUrl, bounceBackUrl } = getEmploymentAndUrl(req)
    const { prisonerNumber, employmentIdx } = req.params

    const { page, sort } = req.query
    journey.organisationSearch ??= { page: 1 }

    if (sort) {
      journey.organisationSearch.sort = sort
      journey.organisationSearch.page = 1
      return res.redirect(`${employmentUrl({ subPath: 'organisation-search' })}#pagination`)
    }
    if (page) {
      const pageNumber = Number(page)
      journey.organisationSearch.page = Number.isNaN(pageNumber) ? 0 : pageNumber
      return res.redirect(`${employmentUrl({ subPath: 'organisation-search' })}#pagination`)
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
        backLink: bounceBackUrl,
      },
      isNewContact: true,
      baseEmploymentLink: `/prisoner/${prisonerNumber}/contacts/create/employments/${employmentIdx}/`,
      journey,
      contact: journey.names,
      ...req.params,
      organisationName: journey.organisationSearch.searchTerm,
      organisations: searchResult?.content ?? [],
      sort: journey.organisationSearch.sort,
    })
  }

  POST = async (req: Request<CreateContactEmploymentParam, unknown, { organisationName?: string }>, res: Response) => {
    const { journey, employmentUrl } = getEmploymentAndUrl(req)
    journey.organisationSearch ??= { page: 1 }

    journey.organisationSearch.searchTerm = req.body.organisationName ?? ''
    journey.organisationSearch.page = 1

    res.redirect(employmentUrl({ subPath: 'organisation-search' }))
  }
}
