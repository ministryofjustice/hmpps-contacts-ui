import { Request, Response } from 'express'
import { Page } from '../../services/auditService'
import { PageHandler } from '../../interfaces/pageHandler'
import PrisonerSearchService from '../../services/prisonerSearchService'
import config from '../../config'
import logger from '../../../logger'
import { getResultsPagingLinks } from '../../utils/utils'

export default class SearchController implements PageHandler {
  constructor(private readonly prisonerSearchService: PrisonerSearchService) {}

  public PAGE_NAME = Page.SEARCH_PRISONERS_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    let prisoners = null
    let pageLinks: object
    let to: number
    let parsedPage: number
    let prisonerNotFoundMessage: string

    if (req.query.search) {
      req.session.search = null
    }

    const search = req.session.search ? req.session.search : req.query.search as string

    const { pageSize } = config.apis.prisonerSearchApi

    try {
      if (res.locals.validationErrors === undefined && search) {
        const currentPage = typeof req.query.page === 'string' ? req.query.page : ''
        parsedPage = Number.parseInt(currentPage, 10) || 1

        logger.info(`Before search - using prisonID from session ${req.session?.prisonId}`)

        // This search relies on the activeCaseloadId being obtained from the frontendComponentsAPI
        // Set within middleware populateCurrentEstablishment
        prisoners = await this.prisonerSearchService.getPrisoners(
          search.toString(),
          req.session.prisonId,
          parsedPage,
          user,
        )

        // Set pagination links
        const currentPageMax = parsedPage * pageSize
        to = prisoners.numberOfResults < currentPageMax ? prisoners.numberOfResults : currentPageMax
        pageLinks = getResultsPagingLinks({
          pagesToShow: config.apis.prisonerSearchApi.pagesLinksToShow,
          numberOfPages: prisoners.numberOfPages,
          currentPage: parsedPage,
          searchParam: `search=${search}`,
          searchUrl: '/search/prisoner',
        })

        // Display messages for prisoners not found
        prisonerNotFoundMessage = await this.prisonerSearchService.validatePrisonNumber(
          search.toString(),
          prisoners.numberOfResults,
          req.session.prisonName,
          user,
        )
      }

      res.render('pages/search/searchPrisoners', {
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
    res.redirect('/search/prisoner')
  }
}
