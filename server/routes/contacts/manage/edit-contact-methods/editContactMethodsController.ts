import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import ContactDetails = contactsApiClientTypes.ContactDetails
import Urls from '../../../urls'
import { getReferenceDataOrderDictionary } from '../../../../utils/sortPhoneNumbers'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'

export default class EditContactMethodsController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.EDIT_CONTACT_METHODS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact: ContactDetails = await this.contactsService.getContact(Number(contactId), user)
    const navigation: Navigation = {
      backLinkLabel: 'Back to contact record',
      backLink: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    return res.render('pages/contacts/manage/contactDetails/details/editContactMethods', {
      contact,
      prisonerNumber,
      contactId,
      prisonerContactId,
      navigation,
      phoneTypeOrderDictionary: getReferenceDataOrderDictionary(
        await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user),
      ),
    })
  }
}
