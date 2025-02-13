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
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest

export default class ChangeTitleOrMiddleNamesController implements PageHandler {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly contactService: ContactsService,
  ) {}

  public PAGE_NAME = Page.UPDATE_NAME_PAGE

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
    const contact = await this.contactService.getContact(Number(contactId), user)

    const titleOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.TITLE, user)
      .then(val => this.getSelectedTitleOptions(val, res.locals?.formResponses?.['title'] ?? contact.title))

    const navigation: Navigation = {
      backLink: Urls.editContactDetails(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }

    const viewModel = {
      contact,
      titleOptions,
      lastName: res.locals?.formResponses?.['lastName'] ?? contact.lastName,
      firstName: res.locals?.formResponses?.['firstName'] ?? contact.firstName,
      middleNames: res.locals?.formResponses?.['middleNames'] ?? contact.middleNames,
      navigation,
    }
    res.render('pages/contacts/manage/changeTitleOrMiddleNames', viewModel)
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
      title: title || null,
      middleNames: middleNames || null,
      updatedBy: user.username,
    }
    await this.contactService
      .updateContactById(Number(contactId), request, user)
      .then(response =>
        req.flash(
          'successNotificationBanner',
          `You’ve updated the personal information for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }

  private getSelectedTitleOptions(
    options: ReferenceCode[],
    selectedTitle?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options
      .map((title: ReferenceCode) => {
        return {
          text: title.description,
          value: title.code,
          selected: title.code === selectedTitle,
        }
      })
      .sort((a, b) => a.text.localeCompare(b.text))
    return [{ text: 'Select title', value: '' }, { text: '', value: '' }, ...mappedOptions]
  }
}
