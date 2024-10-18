import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import formatName from '../../../../utils/formatName'
import { formatNameAsFirstMiddleLast } from '../../../../utils/utils'

import Contact = contactsApiClientTypes.Contact
import GetContactResponse = contactsApiClientTypes.GetContactResponse

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
    let formattedFullName = await this.formattedFullName(contact, user)
    formattedFullName = formatNameAsFirstMiddleLast(formattedFullName)

    return res.render('pages/contacts/manage/contactDetails/details', {
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
    return formatName(contact, { customTitle: titleDescription })
  }
}
