import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { FullNameSchemaType } from '../../common/name/nameSchemas'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import captionForAddContactJourney from '../addContactsUtils'
import Permission from '../../../../enumeration/permission'

export default class EnterNameController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_NAME_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<{ journeyId: string }>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const titleOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.TITLE, user)
    const viewModel = {
      caption: captionForAddContactJourney(journey),
      journey,
      titleCode: res.locals?.formResponses?.['title'] ?? journey?.names?.title,
      titleOptions,
      lastName: res.locals?.formResponses?.['lastName'] ?? journey?.names?.lastName,
      firstName: res.locals?.formResponses?.['firstName'] ?? journey?.names?.firstName,
      middleNames: res.locals?.formResponses?.['middleNames'] ?? journey?.names?.middleNames,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
    }
    res.render('pages/contacts/add/new/enterName', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
        prisonerNumber: string
      },
      unknown,
      FullNameSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { title, lastName, firstName, middleNames } = req.body
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    journey.names = { title, lastName, firstName, middleNames }

    // Remove possible existing records on name change to re-trigger search for existing records
    delete journey.possibleExistingRecords
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
  }
}
