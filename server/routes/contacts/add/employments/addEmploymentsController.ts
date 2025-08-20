import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class AddEmploymentsController implements PageHandler {
  public PAGE_NAME = Page.ADD_EMPLOYMENTS

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals

    journey.pendingEmployments ??= journey.employments
    // clear search term whenever user comes back to this page
    journey.organisationSearch = { page: 1 }

    const view = {
      journey,
      isNewContact: true,
      updateEmploymentBaseLink: `/prisoner/${prisonerNumber}/contacts/create/employments/`,
      journeyId,
      contactNames: journey.names,
      employments: journey.pendingEmployments,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions),
    }
    res.render('pages/contacts/manage/employments/index', view)
  }

  POST = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals

    if (journey.pendingEmployments?.length) {
      journey.employments = journey.pendingEmployments
    } else {
      delete journey.employments
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions))
  }
}
