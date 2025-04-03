import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { Navigation } from '../../../common/navigation'
import { AddressLinesSchema } from './addressLinesSchemas'
import Urls from '../../../../urls'
import { getUpdateAddressDetails } from '../common/utils'
import ContactsService from '../../../../../services/contactsService'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { formatNameFirstNameFirst } from '../../../../../utils/formatName'

export default class ChangeAddressLinesController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.ENTER_ADDRESS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; contactId: string; prisonerContactId: string; contactAddressId: string }>,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId } = req.params
    const { user } = res.locals
    const { contact, addressLines, formattedAddress } = await getUpdateAddressDetails(this.contactsService, req, res)

    const townOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.CITY, user)
    const countyOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.COUNTY, user)
    const countryOptions = await this.referenceDataService.getReferenceData(ReferenceCodeType.COUNTRY, user)

    const navigation: Navigation = {
      backLink: Urls.editContactMethods(prisonerNumber, contactId, prisonerContactId),
      cancelButton: Urls.contactDetails(prisonerNumber, contactId, prisonerContactId),
    }
    const viewModel = {
      isEdit: true,
      caption: 'Edit contact methods',
      continueButtonLabel: 'Confirm and save',
      contact,
      formattedAddress,
      townOptions,
      countyOptions,
      countryOptions,
      usePrisonerAddress: { enabled: false },
      noFixedAddress: res.locals?.formResponses?.['noFixedAddress'] ?? (addressLines.noFixedAddress ? 'YES' : 'NO'),
      flat: res.locals?.formResponses?.['flat'] ?? addressLines.flat,
      property: res.locals?.formResponses?.['property'] ?? addressLines.property,
      street: res.locals?.formResponses?.['street'] ?? addressLines.street,
      area: res.locals?.formResponses?.['area'] ?? addressLines.area,
      cityCode: res.locals?.formResponses?.['cityCode'] ?? addressLines.cityCode,
      countyCode: res.locals?.formResponses?.['countyCode'] ?? addressLines.countyCode,
      postcode: res.locals?.formResponses?.['postcode'] ?? addressLines.postcode,
      countryCode: res.locals?.formResponses?.['countryCode'] ?? addressLines.countryCode,
      navigation,
    }
    res.render('pages/contacts/manage/contactMethods/address/enterAddress', viewModel)
  }

  POST = async (
    req: Request<
      {
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        contactAddressId: string
      },
      unknown,
      AddressLinesSchema
    >,
    res: Response,
  ): Promise<void> => {
    const { prisonerNumber, contactId, prisonerContactId, contactAddressId } = req.params
    const { user } = res.locals
    const { noFixedAddress, flat, property, street, area, cityCode, countyCode, postcode, countryCode } = req.body
    await this.contactsService.updateContactAddress(
      {
        contactId: Number(contactId),
        contactAddressId: Number(contactAddressId),
        flat: flat ?? null,
        property: property ?? null,
        street: street ?? null,
        area: area ?? null,
        cityCode: cityCode ?? null,
        countyCode: countyCode ?? null,
        postcode: postcode ?? null,
        countryCode: countryCode ?? null,
        noFixedAddress: noFixedAddress === 'YES',
      },
      user,
      req.id,
    )
    await this.contactsService
      .getContactName(Number(contactId), user)
      .then(response =>
        req.flash(
          FLASH_KEY__SUCCESS_BANNER,
          `You’ve updated the contact methods for ${formatNameFirstNameFirst(response)}.`,
        ),
      )
    res.redirect(Urls.contactDetails(prisonerNumber, contactId, prisonerContactId))
  }
}
