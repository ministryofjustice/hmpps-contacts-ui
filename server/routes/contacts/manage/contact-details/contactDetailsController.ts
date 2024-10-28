import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { reverseFormatName } from '../../../../utils/formatName'
import { components } from '../../../../@types/contactsApi'

import Contact = contactsApiClientTypes.Contact
import GetContactResponse = contactsApiClientTypes.GetContactResponse
import ManageContactsJourney = journeys.ManageContactsJourney

type PatchContactRequest = components['schemas']['PatchContactRequest']

export default class ContactDetailsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CONTACT_DETAILS_PAGE

  GET = async (
    req: Request<{ contactId?: string; journeyId?: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { contactId } = req.params
    const { prisonerDetails, user } = res.locals
    let journey: ManageContactsJourney

    if (journeyId) {
      journey = req.session.manageContactsJourneys[journeyId]

      if (journey.languageCode) {
        const request: PatchContactRequest = {
          languageCode: journey.languageCode,
          updatedBy: user.userId,
        }
        await this.contactsService.updateContactById(parseInt(contactId, 10), request, user)
      }
    }

    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const formattedFullName = await this.formattedFullName(contact, user)

    return res.render('pages/contacts/manage/contactDetails/details', {
      journey,
      contact,
      prisonerDetails,
      formattedFullName,
    })
  }

  private async formattedFullName(contact: GetContactResponse, user: Express.User) {
    let titleDescription: string
    if (contact.title) {
      titleDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.TITLE,
        contact.title,
        user,
      )
    }
    return reverseFormatName(contact, { customTitle: titleDescription })
  }
}
