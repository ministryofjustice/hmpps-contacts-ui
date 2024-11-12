import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { RestrictedEditingNameSchemaType } from '../../common/name/nameSchemas'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { Navigation } from '../../add/addContactFlowControl'
import { ContactsService } from '../../../../services'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ReturnPoint = journeys.ReturnPoint
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest

export default class UpdateNameController implements PageHandler {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly contactService: ContactsService,
  ) {}

  public PAGE_NAME = Page.UPDATE_NAME_PAGE

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId } = req.params
    const { user } = res.locals
    const contact = await this.contactService.getContact(Number(contactId), user)

    const titleOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.TITLE, user)
      .then(val => this.getSelectedTitleOptions(val, res.locals?.formResponses?.title ?? contact.title))

    const manageContactUrl = `/prisoner/${prisonerNumber}/contacts/manage/${contactId}`
    const returnPoint: ReturnPoint = { type: 'MANAGE_CONTACT', url: manageContactUrl }
    const navigation: Navigation = {
      backLink: manageContactUrl,
    }
    const viewModel = {
      journey: { returnPoint },
      titleOptions,
      lastName: res.locals?.formResponses?.lastName ?? contact.lastName,
      firstName: res.locals?.formResponses?.firstName ?? contact.firstName,
      middleNames: res.locals?.formResponses?.middleNames ?? contact.middleNames,
      navigation,
      restrictedEditing: true,
      continueButtonLabel: 'Confirm and save',
    }
    res.render('pages/contacts/common/enterName', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
      },
      unknown,
      RestrictedEditingNameSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber, contactId } = req.params
    const { title, middleNames } = req.body
    const request: PatchContactRequest = {
      title: title || null,
      middleNames: middleNames || null,
      updatedBy: user.username,
    }
    await this.contactService.updateContactById(Number(contactId), request, user)
    res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)
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
    return [{ text: '', value: '' }, ...mappedOptions]
  }
}
