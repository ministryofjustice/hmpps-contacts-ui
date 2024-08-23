import { Request, Response } from 'express'
import { Page } from '../../services/auditService'
import { PageHandler } from '../../interfaces/pageHandler'
import SEARCH_PRISONER_URL from '../urls'
import PrisonerSearchService from '../../services/prisonerSearchService'
import config from '../../config'
import logger from '../../../logger'
import { getResultsPagingLinks } from '../../utils/utils'

export default class SearchController implements PageHandler {
  constructor(private readonly prisonerSearchService: PrisonerSearchService) {}

  public PAGE_NAME = Page.SEARCH_PRISONERS_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    let prisoners = null
    let pageLinks: object
    let to: number
    let parsedPage: number
    let prisonerNotFoundMessage: string
    if (req.query.search) {
      req.session.search = null
    }
    const search = req.session.search ? req.session.search : req.query.search
    const { pageSize } = config.apis.prisonerSearch
    try {
      if (res.locals.validationErrors === undefined && search) {
        const currentPage = typeof req.query.page === 'string' ? req.query.page : ''
        parsedPage = Number.parseInt(currentPage, 10) || 1

        // TODO: This value should really be set against the res.locals.user ojbect, as `activeCaseloadId`
        // populateCurrentUser middleware is the place to set these things.
        req.session.prisonId = 'HEI'

        // Get prisoner list
        prisoners = await this.prisonerSearchService.getPrisoners(
          search.toString(),
          // TODO: Change to res.locals.user.activeCaseloadId here
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
          searchParam: `search=${search}`,
          searchUrl: `${SEARCH_PRISONER_URL}`,
        })

        // Display messages for prisoners not found
        prisonerNotFoundMessage = await this.prisonerSearchService.validatePrisonNumber(
          search.toString(),
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
        search,
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
