import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import {
  IDENTITY_NUMBER_DUPLICATE,
  IdentitySchemaType,
  isADuplicateIdentity,
} from '../../manage/identities/IdentitySchemas'
import { PrisonerJourneyParams } from '../../../../@types/journeys'
import Permission from '../../../../enumeration/permission'
import { IdentityDocument } from '../../../../@types/contactsApiClient'

export default class AddContactEditIdentityController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_CONTACT_ADD_IDENTITY_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (req: Request<PrisonerJourneyParams & { index: string }>, res: Response): Promise<void> => {
    const { journeyId, index } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user, prisonerPermissions } = res.locals

    const identityToEdit = journey.identities?.[parseInt(index, 10) - 1]
    if (!identityToEdit) {
      throw new Error(`Couldn't find a identity at index ${index}`)
    }

    const viewModel = {
      caption: 'Add a contact and link to a prisoner',
      isNewContact: true,
      continueButtonLabel: 'Continue',
      contact: journey.names,
      typeOptions: await this.referenceDataService.getReferenceData(ReferenceCodeType.ID_TYPE, user),
      ...identityToEdit,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions),
    }
    res.render('pages/contacts/manage/editIdentity', viewModel)
  }

  POST = async (
    req: Request<PrisonerJourneyParams & { index: string }, unknown, IdentitySchemaType>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, index } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals
    const { identityType, identityValue, issuingAuthority } = req.body

    const editedIdentity: IdentityDocument = { identityType, identityValue, issuingAuthority }
    const identityIndex = parseInt(index, 10) - 1
    const otherIdentities = journey.identities!.toSpliced(identityIndex, 1)

    if (isADuplicateIdentity(otherIdentities, editedIdentity)) {
      req.flash('formResponses', JSON.stringify(req.body))
      req.flash(
        'validationErrors',
        JSON.stringify({
          identityValue: [IDENTITY_NUMBER_DUPLICATE],
        }),
      )
      return res.redirect(req.originalUrl)
    }

    journey.identities!.splice(identityIndex, 1, editedIdentity)

    return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions))
  }
}
