import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { PrisonerJourneyParams, YesOrNo } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class CreateContactIsStaffController implements PageHandler {
  public PAGE_NAME = Page.ADD_CONTACT_IS_STAFF_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals
    const view = {
      journey,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions),
      isNewContact: true,
      isStaff: res.locals?.formResponses?.['isStaff'] ?? journey?.isStaff,
    }
    res.render('pages/contacts/manage/contactDetails/isStaff', view)
  }

  POST = async (
    req: Request<
      PrisonerJourneyParams,
      unknown,
      {
        isStaff?: YesOrNo | undefined
      }
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals
    const { body } = req
    journey.isStaff = body.isStaff
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions))
  }
}
