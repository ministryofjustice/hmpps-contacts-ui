import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ManageContactsJourney = journeys.ManageContactsJourney
import UpdateDateOfBirthJourney = journeys.UpdateDateOfBirthJourney
import { ContactsService } from '../../../../../services'
import DateOfBirth = journeys.DateOfBirth

export default class StartUpdateDateOfBirthJourneyController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.UPDATE_CONTACT_DOB_START_PAGE

  private MAX_JOURNEYS = 5

  GET = async (req: Request<{ prisonerNumber: string; contactId: string }>, res: Response): Promise<void> => {
    const { prisonerNumber, contactId } = req.params
    const { user } = res.locals
    const existingContact = await this.contactService.getContact(Number(contactId), user)
    let dateOfBirth: DateOfBirth
    if (existingContact.dateOfBirth) {
      const date = new Date(existingContact.dateOfBirth)
      dateOfBirth = {
        isKnown: 'YES',
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      }
    } else if (existingContact.estimatedIsOverEighteen) {
      dateOfBirth = {
        isKnown: 'NO',
        isOverEighteen: existingContact.estimatedIsOverEighteen,
      }
    } else {
      dateOfBirth = undefined
    }

    const journey: UpdateDateOfBirthJourney = {
      id: uuidv4(),
      prisonerNumber,
      contactId: Number(contactId),
      lastTouched: new Date().toISOString(),
      returnPoint: {
        type: 'MANAGE_CONTACT_RELATIONSHIP',
        url: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`,
      },
      names: {
        title: existingContact.title,
        lastName: existingContact.lastName,
        firstName: existingContact.firstName,
        middleNames: existingContact.middleNames,
      },
      dateOfBirth,
    }

    if (!req.session.updateDateOfBirthJourneys) {
      req.session.updateDateOfBirthJourneys = {}
    }

    req.session.updateDateOfBirthJourneys[journey.id] = journey

    if (Object.entries(req.session.updateDateOfBirthJourneys).length > this.MAX_JOURNEYS) {
      Object.values(req.session.updateDateOfBirthJourneys)
        .sort(
          (a: ManageContactsJourney, b: ManageContactsJourney) =>
            new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
        )
        .slice(this.MAX_JOURNEYS)
        .forEach(journeyToRemove => delete req.session.updateDateOfBirthJourneys[journeyToRemove.id])
    }

    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-dob/enter-dob/${journey.id}`)
  }
}
