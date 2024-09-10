import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import config from '../../../../config'
import { PrisonerSearchService } from '../../../../services'
import { PagePrisoner, PaginationRequest } from '../../../../data/prisonerOffenderSearchTypes'
import { PrisonerSearchSchemaType } from './prisonerSearchSchema'
import logger from '../../../../../logger'

export default class PrisonerSearchController implements PageHandler {
  constructor(private readonly prisonerSearchService: PrisonerSearchService) {}

  public PAGE_NAME = Page.PRISONER_SEARCH_RESULTS_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]

    logger.info(`Journey = ${JSON.stringify(journey)}`)

    // Could be paginated request for next/previous or first/last page
    const page = Number(req.query.page as unknown) || 0
    const pageSize = config.apis.prisonerSearchApi.pageSize || 20
    const prisonId = req.session?.prisonId
    const prisonName = req.session?.prisonName

    logger.info(`Res.locals.formResponses = ${JSON.stringify(res.locals.formResponses)}`)
    const search = res.locals.formResponses?.search ?? journey?.search?.searchTerm

    const validationErrors = res.locals.validationErrors?.search
    logger.info(`Validation errors = ${JSON.stringify(validationErrors)}`)

    const results = validationErrors
      ? ({ totalPages: 0, totalElements: 0, content: [] } as PagePrisoner)
      : await this.prisonerSearchService.searchInCaseload(
          search,
          prisonId,
          { page, size: pageSize } as PaginationRequest,
          user,
        )

    res.render('pages/contacts/manage/prisonerSearchResults', { search, results, journey, prisonName })
  }

  POST = async (
    req: Request<{ journeyId: string }, unknown, PrisonerSearchSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { search } = req.body
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]
    journey.search = { searchTerm: search }
    res.redirect(`/contacts/manage/prisoner-search-results/${journeyId}`)
  }
}
