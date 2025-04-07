import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { CreateContactAddressParam, getAddressFormAndUrl } from '../common/utils'
import { getFormattedAddress } from '../../../manage/addresses/common/utils'
import { AddressDatesSchemaType } from '../../../manage/addresses/dates/addressDatesSchemas'

export default class CreateContactAddressDatesController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.CREATE_CONTACT_ENTER_ADDRESS_DATES_PAGE

  GET = async (req: Request<CreateContactAddressParam>, res: Response): Promise<void> => {
    const { journey, addressForm, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)
    const navigation: Navigation = {
      backLink: bounceBackOrAddressUrl({ subPath: 'enter-address' }),
    }
    const viewModel = {
      isNewContact: true,
      journey,
      contact: journey.names,
      navigation,
      formattedAddress: await getFormattedAddress(this.referenceDataService, addressForm, res.locals.user),
      fromMonth:
        res.locals?.formResponses?.['fromMonth'] ??
        addressForm.addressMetadata?.fromMonth ??
        String(new Date().getMonth() + 1),
      fromYear:
        res.locals?.formResponses?.['fromYear'] ??
        addressForm.addressMetadata?.fromYear ??
        String(new Date().getFullYear()),
      toMonth: res.locals?.formResponses?.['toMonth'] ?? addressForm.addressMetadata?.toMonth,
      toYear: res.locals?.formResponses?.['toYear'] ?? addressForm.addressMetadata?.toYear,
    }
    res.render('pages/contacts/manage/contactMethods/address/dates', viewModel)
  }

  POST = async (
    req: Request<CreateContactAddressParam, unknown, AddressDatesSchemaType>,
    res: Response,
  ): Promise<void> => {
    const { addressForm, bounceBackOrAddressUrl } = getAddressFormAndUrl(req)
    addressForm.addressMetadata = {
      ...(addressForm.addressMetadata ?? {}),
      fromMonth: req.body.fromMonth,
      fromYear: req.body.fromYear,
      toMonth: req.body.toMonth,
      toYear: req.body.toYear,
    }
    res.redirect(bounceBackOrAddressUrl({ subPath: 'primary-or-postal' }))
  }
}
