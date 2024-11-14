import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'

import { EnterEstimatedDobSchemas } from '../../common/enter-estimated-dob/enterEstimatedDobSchemas'
import { Navigation } from '../../add/addContactFlowControl'
import { ContactsService } from '../../../../services'
import ContactNames = journeys.ContactNames
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest

export default class UpdateEstimatedDobController implements PageHandler {
  constructor(private readonly contactService: ContactsService) {}

  public PAGE_NAME = Page.UPDATE_ESTIMATED_DOB_PAGE

  GET = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
      },
      unknown,
      unknown
    >,
    res: Response,
  ): Promise<void> => {
    const { contactId } = req.params
    const { user } = res.locals
    const { journey } = res.locals

    const contact = await this.contactService.getContact(Number(contactId), user)
    const names: ContactNames = {
      title: contact.title,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
    }
    const navigation: Navigation = { backLink: journey.returnPoint.url }
    const view = {
      journey: { ...journey, names },
      isOverEighteen: res.locals?.formResponses?.isOverEighteen ?? contact.estimatedIsOverEighteen,
      navigation,
      continueButtonLabel: 'Confirm and save',
    }
    res.render('pages/contacts/common/enterEstimatedDob', view)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
      },
      unknown,
      EnterEstimatedDobSchemas
    >,
    res: Response,
  ): Promise<void> => {
    const { contactId } = req.params
    const { user } = res.locals
    const { journey } = res.locals

    const { body } = req
    let isOverEighteen
    switch (body.isOverEighteen) {
      case 'YES':
        isOverEighteen = 'YES'
        break
      case 'NO':
        isOverEighteen = 'NO'
        break
      case 'DO_NOT_KNOW':
        isOverEighteen = 'DO_NOT_KNOW'
        break
      default:
        isOverEighteen = null
    }
    const request: PatchContactRequest = {
      estimatedIsOverEighteen: isOverEighteen,
      updatedBy: user.username,
    }
    await this.contactService.updateContactById(Number(contactId), request, user)
    res.redirect(journey.returnPoint.url)
  }
}
