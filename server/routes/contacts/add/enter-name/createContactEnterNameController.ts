import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { CreateContactEnterNameSchemaType } from './createContactEnterNameSchemas'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'

export default class EnterNameController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_NAME_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys[journeyId]
    const titleOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.TITLE, user)
      .then(val => this.getSelectedTitleOptions(val, res.locals?.formResponses?.title ?? journey?.names?.title))
    const viewModel = {
      journey,
      titleOptions,
      lastName: res.locals?.formResponses?.lastName ?? journey?.names?.lastName,
      firstName: res.locals?.formResponses?.firstName ?? journey?.names?.firstName,
      middleName: res.locals?.formResponses?.middleName ?? journey?.names?.middleName,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/enterName', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
        prisonerNumber: string
      },
      unknown,
      CreateContactEnterNameSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { title, lastName, firstName, middleName } = req.body
    const journey = req.session.addContactJourneys[journeyId]
    journey.names = { title, lastName, firstName, middleName }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
  }

  private getSelectedTitleOptions(
    options: ReferenceCode[],
    selectedTitle?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options.map((title: ReferenceCode) => {
      return {
        text: title.description,
        value: title.code,
        selected: title.code === selectedTitle,
      }
    })
    return [{ text: '', value: '' }, ...mappedOptions]
  }
}
