import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { reverseFormatName } from '../../../../utils/formatName'

import Contact = contactsApiClientTypes.Contact
import ContactDetails = contactsApiClientTypes.ContactDetails
import { capitalizeFirstLetter } from '../../../../utils/utils'

export default class ContactDetailsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.CONTACT_DETAILS_PAGE

  GET = async (req: Request<{ contactId?: string }, unknown, unknown>, res: Response): Promise<void> => {
    const { contactId } = req.params
    const { prisonerDetails, user } = res.locals
    const contact: Contact = await this.contactsService.getContact(parseInt(contactId, 10), user)
    const formattedFullName = await this.formattedFullName(contact, user)
    const formattedGender = await this.formattedGender(contact, user)

    return res.render('pages/contacts/manage/contactDetails/details', {
      contact,
      prisonerDetails,
      formattedFullName,
      formattedGender,
    })
  }

  private async formattedFullName(contact: ContactDetails, user: Express.User) {
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

  private async formattedGender(contact: ContactDetails, user: Express.User) {
    let genderDescription: string
    if (contact.genderDescription) {
      genderDescription = await this.referenceDataService.getReferenceDescriptionForCode(
        ReferenceCodeType.GENDER,
        contact.gender,
        user,
      )
    }
    return capitalizeFirstLetter(genderDescription)
  }
}
