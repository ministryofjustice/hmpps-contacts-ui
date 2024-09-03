import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import config from '../../../../config'
import logger from '../../../../../logger'
import { PrisonerSearchService } from '../../../../services'
import { PaginationRequest } from '../../../../data/prisonerOffenderSearchTypes'

export default class PrisonerSearchController implements PageHandler {
  constructor(private readonly prisonerSearchService: PrisonerSearchService) {}

  public PAGE_NAME = Page.PRISONER_SEARCH_RESULTS_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const page = Number(req.query.page as unknown) || 0
    const pageSize = config.apis.prisonerSearchApi.pageSize || 20
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]
    const { searchTerm } = journey.search

    const results = await this.prisonerSearchService.searchInCaseload(
      searchTerm,
      req.session.prisonId,
      { page, size: pageSize } as PaginationRequest,
      user,
    )
    logger.info(`prisoner search results = elements ${results?.totalElements}, pages ${results?.totalPages}`)
    res.render('pages/contacts/manage/prisonerSearchResults', { results, journey })
  }
}
