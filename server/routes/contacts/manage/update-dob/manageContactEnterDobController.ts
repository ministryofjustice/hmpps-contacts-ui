import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { EnterDobSchemaType } from '../../common/enter-dob/enterDobSchemas'
import { Navigation } from '../../common/navigation'
import { ContactsService } from '../../../../services'
import DateOfBirth = journeys.DateOfBirth
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest

export default class ManageContactEnterDobController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.UPDATE_CONTACT_DOB_ENTER_DOB_PAGE

  GET = async (req: Request<{ prisonerNumber: string; contactId: string }>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { user, journey } = res.locals
    const navigation: Navigation = { backLink: journey.returnPoint.url }

    const contact = await this.contactService.getContact(Number(contactId), user)
    journey.names = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }

    let dateOfBirth: DateOfBirth | undefined
    // Only set from the contact if the form has not been submitted and returned with an error.
    if (!res.locals?.formResponses) {
      if (contact.dateOfBirth) {
        const date = new Date(contact.dateOfBirth)
        dateOfBirth = {
          isKnown: 'YES',
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
        }
      } else {
        dateOfBirth = { isKnown: 'NO' }
      }
    }

    const view = {
      journey,
      isKnown: res.locals?.formResponses?.['isKnown'] ?? dateOfBirth?.isKnown,
      day: res.locals?.formResponses?.['day'] ?? dateOfBirth?.day,
      month: res.locals?.formResponses?.['month'] ?? dateOfBirth?.month,
      year: res.locals?.formResponses?.['year'] ?? dateOfBirth?.year,
      navigation,
    }
    res.render('pages/contacts/common/enterDob', view)
  }

  POST = async (
    req: Request<{ prisonerNumber: string; contactId: string }, unknown, EnterDobSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { contactId } = req.params
    const { user, journey } = res.locals
    const { body } = req
    let dateOfBirth: Date | undefined
    if (body.isKnown === 'YES') {
      dateOfBirth = new Date(`${body.year}-${body.month}-${body.day}Z`)
    }
    const request: PatchContactRequest = {
      dateOfBirth,
      updatedBy: user.username,
    }
    await this.contactService.updateContactById(Number(contactId), request, user)

    res.redirect(journey.returnPoint.url)
  }
}
