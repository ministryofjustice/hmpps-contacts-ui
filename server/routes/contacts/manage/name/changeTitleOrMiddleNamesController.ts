import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { RestrictedEditingNameSchemaType } from '../../common/name/nameSchemas'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { ContactsService } from '../../../../services'
import { Navigation } from '../../common/navigation'
import { formatNameFirstNameFirst } from '../../../../utils/formatName'
import Urls from '../../../urls'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../middleware/setUpSuccessNotificationBanner'
import { PatchContactRequest } from '../../../../@types/contactsApiClient'
import Permission from '../../../../enumeration/permission'

export default class ChangeTitleOrMiddleNamesController implements PageHandler {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly contactService: ContactsService,
  ) {}

  public PAGE_NAME = Page.UPDATE_NAME_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const contact = await this.contactService.getContactName(Number(contactId), user)

    const titleOptions = [
      { code: '', description: '' },
      ...(await this.referenceDataService.getReferenceData(ReferenceCodeType.TITLE, user)),
    ]

    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    const viewModel = {
      contact,
      titleOptions,
      titleCode: res.locals?.formResponses?.['title'] ?? contact.titleCode,
      lastName: res.locals?.formResponses?.['lastName'] ?? contact.lastName,
      firstName: res.locals?.formResponses?.['firstName'] ?? contact.firstName,
      middleNames: res.locals?.formResponses?.['middleNames'] ?? contact.middleNames,
      navigation,
    }
    res.render('pages/contacts/manage/contactDetails/changeTitleOrMiddleNames', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
      },
      unknown,
      RestrictedEditingNameSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { title, middleNames } = req.body
    const request: PatchContactRequest = {
      // @ts-expect-error mistyped by openapi script. this property can be set to null to unset its value.
      titleCode: title || null,
      // @ts-expect-error mistyped by openapi script. this property can be set to null to unset its value.
      middleNames: middleNames || null,
    }
    await this.contactService
      .updateContactById(Number(contactId), request, user, req.id)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the personal information for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
