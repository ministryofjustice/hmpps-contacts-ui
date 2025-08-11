import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { ManageContactsJourney } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class StartPrisonerSearchJourneyController implements PageHandler {
  public PAGE_NAME = Page.MANAGE_CONTACTS_START_PAGE

  public REQUIRED_PERMISSION = Permission.read_contacts

  private MAX_JOURNEYS = 5

  GET = async (req: Request, res: Response): Promise<void> => {
    // Create a new journey object for managing contacts
    const journey: ManageContactsJourney = { id: uuidv4(), lastTouched: new Date().toISOString() }

    // Create the object for journeys if not present in the session
    if (!req.session.manageContactsJourneys) {
      req.session.manageContactsJourneys = {}
    }

    // Add this journey to the list
    req.session.manageContactsJourneys[journey.id] = journey

    // Replace the oldest journey if more than MAX_JOURNEYS exist
    if (Object.entries(req.session.manageContactsJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.manageContactsJourneys)
        .sort(
          (a: ManageContactsJourney, b: ManageContactsJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.manageContactsJourneys![journeyToRemove.id])
    }

    res.redirect(`/contacts/manage/prisoner-search/${journey.id}`)
  }
}
