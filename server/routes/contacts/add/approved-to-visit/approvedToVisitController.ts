import { Request, Response } from 'express'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class ApprovedToVisitController implements PageHandler {
  public PAGE_NAME = Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contact_visit_approval

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals
    const viewModel = {
      isNewContact: true,
      journey,
      contact: journey.names,
      isApprovedVisitor: journey.relationship?.isApprovedVisitor,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions),
    }
    res.render('pages/contacts/manage/contactDetails/relationship/manageApprovedToVisit', viewModel)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, { isApprovedToVisit?: 'YES' | 'NO' }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals
    const { isApprovedToVisit } = req.body
    journey.relationship ??= {}
    if (isApprovedToVisit) {
      journey.relationship.isApprovedVisitor = isApprovedToVisit === 'YES'
    } else {
      delete journey.relationship.isApprovedVisitor
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions))
  }
}
