import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import config from '../../../../config'
import { PrisonerSearchService } from '../../../../services'
import { PagePrisoner, PaginationRequest } from '../../../../data/prisonerOffenderSearchTypes'
import { PrisonerSearchSchemaType } from './prisonerSearchSchema'
import Permission from '../../../../enumeration/permission'

export default class PrisonerSearchController implements PageHandler {
  constructor(private readonly prisonerSearchService: PrisonerSearchService) {}

  public PAGE_NAME = Page.PRISONER_SEARCH_RESULTS_PAGE

  public REQUIRED_PERMISSION = Permission.VIEW_CONTACT_LIST

  GET = async (req: Request<{ journeyId: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys![journeyId]!

    const page = Number(req.query['page'] as unknown) || 0
    const pageSize = config.apis.prisonerSearchApi.pageSize || 20
    const prisonId = req.session.activeCaseLoadId!
    const prisonName = req.session?.activeCaseLoad?.description
    const search = res.locals.formResponses?.['search'] ?? journey.search!.searchTerm!
    const validationErrors = res.locals.validationErrors?.['search']

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
    const journey = req.session.manageContactsJourneys![journeyId]!
    journey.search = { searchTerm: search }
    res.redirect(`/contacts/manage/prisoner-search-results/${journeyId}`)
  }
}
