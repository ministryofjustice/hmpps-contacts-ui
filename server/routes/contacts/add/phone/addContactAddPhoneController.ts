import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { PhonesSchemaType } from '../../manage/addresses/add-address-phone/AddAddressPhonesSchema'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from '../addContactFlowControl'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class AddContactAddPhoneController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_CONTACT_ADD_PHONE_PAGE

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!
    const { user } = res.locals
    const existingPhoneNumbers = journey.phoneNumbers ?? []
    if (existingPhoneNumbers.length === 0) {
      existingPhoneNumbers.push({ type: '', phoneNumber: '', extension: '' })
    }
    const viewModel = {
      journey,
      typeOptions: await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user),
      phones: res.locals?.formResponses?.['phones'] ?? existingPhoneNumbers,
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
      isNewContact: true,
    }
    res.render('pages/contacts/manage/contactMethods/addPhone', viewModel)
  }

  POST = async (req: Request<PrisonerJourneyParams, unknown, PhonesSchemaType>, res: Response): Promise<void> => {
    const { prisonerNumber, journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    const { phones, save, add, remove } = req.body
    if (save !== undefined) {
      journey.phoneNumbers = phones
      return res.redirect(nextPageForAddContactJourney(this.PAGE_NAME, journey))
    }
    if (add !== undefined) {
      phones.push({ type: '', phoneNumber: '', extension: '' })
    } else if (remove !== undefined) {
      phones.splice(Number(remove), 1)
    }
    // Always redirect back to input even if we didn't find an action, which should be impossible but there is a small
    // possibility if JS is disabled after a page load or the user somehow removes all identities.
    req.flash('formResponses', JSON.stringify(req.body))
    return res.redirect(`/prisoner/${prisonerNumber}/contacts/create/add-phone-numbers/${journeyId}`)
  }
}
