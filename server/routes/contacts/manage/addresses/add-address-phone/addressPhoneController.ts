import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { getAddressJourneyAndUrl, getFormattedAddress } from '../common/utils'
import { OptionalPhonesSchemaType } from './AddAddressPhonesSchema'

export default class AddressPhoneController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_ADDRESS_PHONE_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; journeyId: string }>,
    res: Response,
  ): Promise<void> => {
    const { user } = res.locals
    const { journey, checkAnswersOrAddressUrl } = getAddressJourneyAndUrl(req)
    const navigation: Navigation = {
      backLink: checkAnswersOrAddressUrl({ subPath: 'primary-or-postal' }),
    }
    const viewModel = {
      navigation,
      typeOptions: await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user),
      formattedAddress: await getFormattedAddress(this.referenceDataService, journey, res.locals.user),
      phones: res.locals?.formResponses?.['phones'] ??
        journey.phoneNumbers ?? [{ type: '', phoneNumber: '', extension: '' }],
    }
    res.render('pages/contacts/manage/contactMethods/address/phone/addAddressPhone', viewModel)
  }

  POST = async (
    req: Request<
      { prisonerNumber: string; contactId: string; prisonerContactId: string; journeyId: string },
      unknown,
      OptionalPhonesSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journey, checkAnswersOrAddressUrl, addressUrl } = getAddressJourneyAndUrl(req)
    const { phones, save, add, remove } = req.body
    if (save !== undefined) {
      journey.phoneNumbers = phones
      res.redirect(checkAnswersOrAddressUrl({ subPath: 'comments' }))
    } else {
      req.body.phones ??= [{ type: '', phoneNumber: '', extension: '' }]
      if (add !== undefined) {
        req.body.phones.push({ type: '', phoneNumber: '', extension: '' })
      } else if (remove !== undefined) {
        req.body.phones.splice(Number(remove), 1)
      }
      // Always redirect back to input even if we didn't find an action, which should be impossible but there is a small
      // possibility if JS is disabled after a page load or the user somehow removes all identities.
      req.flash('formResponses', JSON.stringify(req.body))
      res.redirect(addressUrl({ subPath: 'phone' }))
    }
  }
}
