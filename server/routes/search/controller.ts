import { Request, Response } from 'express'
import AuditService, { Page } from '../../services/auditService'
import SEARCH_PRISONER_URL from '../urls'
import PrisonerSearchService from '../../services/prisonerSearchService'
import config from '../../config'
import logger from '../../../logger'
import { getResultsPagingLinks } from '../../utils/utils'

export default class SearchController {
  constructor(
    private readonly auditService: AuditService,
    private readonly prisonerSearchService: PrisonerSearchService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    await this.auditService.logPageView(Page.EXAMPLE_PAGE, { who: res.locals.user.username, correlationId: req.id })

    let prisoners = null
    let pageLinks: object
    let to: number
    let parsedPage: number
    let prisonerNotFoundMessage: string
    const { pageSize } = config.apis.prisonerSearch
    try {
      if (res.locals.validationErrors === undefined && req.session.search) {
        const currentPage = typeof req.query.page === 'string' ? req.query.page : ''
        parsedPage = Number.parseInt(currentPage, 10) || 1

        // Get prisoner list
        prisoners = await this.prisonerSearchService.getPrisoners(
          req.session.search,
          req.session.prisonId,
          res.locals.user.username,
          parsedPage,
        )

        // Set pagination links
        const currentPageMax = parsedPage * pageSize
        to = prisoners.numberOfResults < currentPageMax ? prisoners.numberOfResults : currentPageMax
        pageLinks = getResultsPagingLinks({
          pagesToShow: config.apis.prisonerSearch.pagesLinksToShow,
          numberOfPages: prisoners.numberOfPages,
          currentPage: parsedPage,
          searchParam: `search=${req.session.search}`,
          searchUrl: `${SEARCH_PRISONER_URL}?`,
        })

        // Display messages for prisoners not found
        prisonerNotFoundMessage = await this.prisonerSearchService.validatePrisonNumber(
          req.session.search,
          prisoners.numberOfResults,
          req.session.prisonName,
          res.locals.user.username,
        )
      }

      res.render('search/view', {
        validationErrors: res.locals.validationErrors,
        numberOfPages: prisoners ? prisoners.numberOfPages : 0,
        numberOfResults: prisoners ? prisoners.numberOfResults : 0,
        results: prisoners ? prisoners.results : null,
        previous: prisoners ? prisoners.previous : null,
        next: prisoners ? prisoners.next : null,
        search: req.session.search,
        from: (parsedPage - 1) * pageSize + 1,
        to,
        pageLinks: prisoners && prisoners.numberOfPages <= 1 ? [] : pageLinks,
        prisonerNotFoundMessage,
      })
    } catch (error) {
      logger.error(error)
    }
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.search = req.body.search
    res.redirect(SEARCH_PRISONER_URL)
  }
}
