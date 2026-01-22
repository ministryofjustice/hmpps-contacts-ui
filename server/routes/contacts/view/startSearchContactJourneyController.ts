import e, { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import Permission from '../../../enumeration/permission'

export default class StartSearchContactJourneyController implements PageHandler {
  public PAGE_NAME = Page.CONTACT_SEARCH_START_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<
      {
        contactId: string
        prisonerContactId: string
      },
      unknown,
      unknown
    >,
    res: Response,
  ): Promise<void> => {
    const journey = this.setSessionData(req)
    res.redirect(`/direct/contacts/search/${journey.id}`)
  }

  private setSessionData(req: e.Request) {
    const journey = {
      id: uuidv4(),
      lastTouched: new Date().toISOString(),
      contact: {},
    }
    if (!req.session.searchContactJourneys) {
      req.session.searchContactJourneys = {}
    }
    req.session.searchContactJourneys[journey.id] = journey
    return journey
  }
}
