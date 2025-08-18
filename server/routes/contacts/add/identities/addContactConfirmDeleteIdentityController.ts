import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'

export default class AddContactConfirmDeleteIdentityController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_CONTACT_DELETE_IDENTITY_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (
    req: Request<PrisonerJourneyParams & { index: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, index } = req.params
    const { user, prisonerPermissions } = res.locals
    const journey = req.session.addContactJourneys![journeyId]!
    const identityToRemove = journey.identities?.[Number(index) - 1]
    if (!identityToRemove) {
      throw new Error(`Couldn't find a identity at index ${index}`)
    }
    const view = {
      caption: 'Add a contact and link to a prisoner',
      contact: journey.names,
      isNewContact: true,
      identityDocument: {
        ...identityToRemove,
        identityTypeDescription: await this.referenceDataService.getReferenceDescriptionForCode(
          ReferenceCodeType.ID_TYPE,
          identityToRemove.identityType,
          user,
        ),
      },
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions),
    }
    res.render('pages/contacts/manage/contactDetails/confirmDeleteIdentity', view)
  }

  POST = async (req: Request<PrisonerJourneyParams & { index: string }>, res: Response): Promise<void> => {
    const { journeyId, index } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals
    const indexNumber = Number(index) - 1
    if (journey.identities && indexNumber <= journey.identities.length - 1) {
      journey.identities.splice(indexNumber, 1)
    }
    if (!journey.identities?.length) delete journey.identities
    res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions))
  }
}
