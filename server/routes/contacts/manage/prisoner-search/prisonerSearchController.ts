import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { PrisonerSearchSchemaType } from './prisonerSearchSchema'
import Permission from '../../../../enumeration/permission'

export default class PrisonerSearchController implements PageHandler {
  public PAGE_NAME = Page.PRISONER_SEARCH_PAGE

  public REQUIRED_PERMISSION = Permission.VIEW_CONTACT_LIST

  GET = async (req: Request<{ journeyId: string }>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys![journeyId]!
    const search = res.locals?.formResponses?.['search'] ?? journey?.search?.searchTerm
    res.render('pages/contacts/manage/prisonerSearch', { search, journey })
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
