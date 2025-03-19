import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { navigationForAddContactJourney } from '../addContactFlowControl'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams
import ReferenceDataService from '../../../../services/referenceDataService'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import AddressForm = journeys.AddressForm

export default class AddAddressesController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.ADD_ADDRESSES

  GET = async (req: Request<PrisonerJourneyParams, unknown, unknown>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    journey.pendingAddresses ??= journey.addresses
    delete journey.newAddress

    const view = {
      ...req.params,
      contact: journey.names,
      addresses: await this.formatAddresses(journey.pendingAddresses, user),
      navigation: navigationForAddContactJourney(this.PAGE_NAME, journey),
    }
    res.render('pages/contacts/add/addresses/index', view)
  }

  POST = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { prisonerNumber, journeyId } = req.params
    const journey = req.session.addContactJourneys![journeyId]!

    journey.addresses = journey.pendingAddresses
    res.redirect(`/prisoner/${prisonerNumber}/contacts/add/enter-additional-info/${journeyId}`)
  }

  private formatAddresses = async (addresses: AddressForm[] | undefined, user: Express.User) => {
    if (!addresses?.length) {
      return addresses
    }

    const addressTypeDescriptions = new Map(
      (await this.referenceDataService.getReferenceData(ReferenceCodeType.ADDRESS_TYPE, user)).map(refData => [
        refData.code,
        refData.description,
      ]),
    )
    const cityDescriptions = new Map(
      (await this.referenceDataService.getReferenceData(ReferenceCodeType.CITY, user)).map(refData => [
        refData.code,
        refData.description,
      ]),
    )
    const countyDescriptions = new Map(
      (await this.referenceDataService.getReferenceData(ReferenceCodeType.COUNTY, user)).map(refData => [
        refData.code,
        refData.description,
      ]),
    )
    const countryDescriptions = new Map(
      (await this.referenceDataService.getReferenceData(ReferenceCodeType.COUNTRY, user)).map(refData => [
        refData.code,
        refData.description,
      ]),
    )
    const phoneTypeDescriptions = new Map(
      (await this.referenceDataService.getReferenceData(ReferenceCodeType.PHONE_TYPE, user)).map(refData => [
        refData.code,
        refData.description,
      ]),
    )

    return addresses.map(address => ({
      ...address.addressLines,
      ...address.addressMetadata,
      addressTypeDescription: address.addressType && addressTypeDescriptions.get(address.addressType),
      cityDescription: address.addressLines?.cityCode && cityDescriptions.get(address.addressLines.cityCode),
      countyDescription: address.addressLines?.countyCode && countyDescriptions.get(address.addressLines.countyCode),
      countryDescription:
        address.addressLines?.countryCode && countryDescriptions.get(address.addressLines.countryCode),
      phoneNumbers: address.phoneNumbers?.map(phone => ({
        phoneNumber: phone.phoneNumber,
        extNumber: phone.extension,
        phoneTypeDescription: phoneTypeDescriptions.get(phone.type),
      })),
    }))
  }
}
