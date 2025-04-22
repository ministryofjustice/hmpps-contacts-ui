import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import { OptionalIdentitiesSchemaType } from '../../manage/identities/IdentitySchemas'
import { PrisonerJourneyParams } from '../../../../@types/journeys'

export default class AddContactAddIdentitiesController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_CONTACT_ADD_IDENTITY_PAGE

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    const existingIdentities = journey.identities ?? []
    if (existingIdentities.length === 0) {
      existingIdentities.push({ identityType: '', identityValue: '', issuingAuthority: '' })
    }
    const viewModel = {
      caption: 'Add a contact and link to a prisoner',
      isNewContact: true,
      continueButtonLabel: 'Continue',
      contact: journey.names,
      typeOptions: await this.referenceDataService.getReferenceData(ReferenceCodeType.ID_TYPE, user),
      identities: res.locals?.formResponses?.['identities'] ?? existingIdentities,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/manage/addIdentities', viewModel)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, OptionalIdentitiesSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    const { identities, save, add, remove } = req.body
    if (save !== undefined) {
      journey.identities = identities
      return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
    }

    req.body.identities ??= [{ identityType: '', identityValue: '', issuingAuthority: '' }]
    if (add !== undefined) {
      req.body.identities.push({ identityType: '', identityValue: '', issuingAuthority: '' })
    } else if (remove !== undefined) {
      req.body.identities.splice(Number(remove), 1)
    }

    // Always redirect back to input even if we didn't find an action, which should be impossible but there is a small
    // possibility if JS is disabled after a page load or the user somehow removes all identities.
    req.flash('formResponses', JSON.stringify(req.body))
    return res.redirect(`/prisoner/${prisonerNumber}/contacts/create/identities/${journeyId}`)
  }
}
