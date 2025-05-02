import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { LanguageAndInterpreterRequiredForm, PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class CreateContactLanguageAndInterpreterController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE

  public REQUIRED_PERMISSION = Permission.MANAGE_CONTACTS

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const spokenLanguages = await this.referenceDataService.getReferenceData(ReferenceCodeType.LANGUAGE, user)
    const view = {
      journey,
      spokenLanguages,
      isNewContact: true,
      language: res.locals?.formResponses?.['language'] ?? journey?.languageAndInterpreter?.language,
      interpreterRequired:
        res.locals?.formResponses?.['interpreterRequired'] ?? journey?.languageAndInterpreter?.interpreterRequired,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, user),
    }
    res.render('pages/contacts/manage/contactDetails/languageAndInterpreter', view)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, LanguageAndInterpreterRequiredForm>,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    const { body } = req
    delete journey.languageAndInterpreter
    if (body.language || body.interpreterRequired) {
      journey.languageAndInterpreter = {
        language: body.language ? body.language : undefined,
        interpreterRequired: body.interpreterRequired ? body.interpreterRequired : undefined,
      }
    }
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, user))
  }
}
