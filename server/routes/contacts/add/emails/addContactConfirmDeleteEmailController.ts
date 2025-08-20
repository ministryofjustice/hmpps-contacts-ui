import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class AddContactConfirmDeleteEmailController implements PageHandler {
  public PAGE_NAME = Page.ADD_CONTACT_DELETE_EMAIL_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<PrisonerJourneyParams & { index: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, index } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals
    const emailToRemove = journey.emailAddresses?.[Number(index) - 1]
    if (!emailToRemove) {
      throw new Error(`Couldn't find an email address at index ${index}`)
    }
    const view = {
      contact: journey.names,
      isNewContact: true,
      email: emailToRemove,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions),
    }
    res.render('pages/contacts/manage/contactMethods/confirmDeleteEmail', view)
  }

  POST = async (req: Request<PrisonerJourneyParams & { index: string }>, res: Response): Promise<void> => {
    const { journeyId, index } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals
    const indexNumber = Number(index) - 1
    if (journey.emailAddresses && indexNumber <= journey.emailAddresses.length - 1) {
      journey.emailAddresses.splice(indexNumber, 1)
    }
    if (!journey.emailAddresses?.length) delete journey.emailAddresses
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions))
  }
}
