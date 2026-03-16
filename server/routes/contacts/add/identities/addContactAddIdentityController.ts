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

export default class AddContactAddIdentityController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_CONTACT_ADD_IDENTITY_PAGE

  public REQUIRED_PERMISSION = Permission.edit_contacts

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user, prisonerPermissions } = res.locals

    const viewModel = {
      caption: 'Add a contact and link to a prisoner',
      isNewContact: true,
      continueButtonLabel: 'Continue',
      contact: journey.names,
      typeOptions: await this.referenceDataService.getReferenceData(ReferenceCodeType.ID_TYPE, user),
      identityValue: res.locals?.formResponses?.['identityValue'],
      identityType: res.locals?.formResponses?.['identityType'],
      issuingAuthority: res.locals?.formResponses?.['issuingAuthority'],
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions),
    }
    res.render('pages/contacts/manage/addIdentity', viewModel)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, IdentitySchemaType>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { prisonerPermissions } = res.locals

    const { identityType, identityValue, issuingAuthority } = req.body
    const newIdentity: IdentityDocument = { identityType, identityValue, issuingAuthority }

    if (!journey.identities?.length) {
      journey.identities = [newIdentity]
      return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions))
    }

    if (isADuplicateIdentity(journey.identities, newIdentity)) {
      req.flash('formResponses', JSON.stringify(req.body))
      req.flash(
        'validationErrors',
        JSON.stringify({
          identityValue: [IDENTITY_NUMBER_DUPLICATE],
        }),
      )
      return res.redirect(req.originalUrl)
    }

    journey.identities?.push(newIdentity)
    return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey, prisonerPermissions))
  }
}
