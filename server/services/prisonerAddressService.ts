import { PrisonApiClient } from '../data'
import AddressLines = journeys.AddressLines

export default class PrisonerAddressService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  private DEFAULT_COUNTRY = 'ENG'

  async getPrimaryAddress(prisonerNumber: string, user: Express.User): Promise<AddressLines | undefined> {
    return this.prisonApiClient
      .getOffenderAddresses(prisonerNumber, user)
      .then(addresses => addresses.find(address => address.primary))
      .then(
        primaryAddress =>
          primaryAddress && {
            noFixedAddress: primaryAddress.noFixedAddress,
            flat: primaryAddress.flat,
            property: primaryAddress.premise,
            street: primaryAddress.street,
            area: primaryAddress.locality,
            cityCode: primaryAddress.townCode,
            countyCode: primaryAddress.countyCode,
            postcode: primaryAddress.postalCode,
            countryCode: primaryAddress.countryCode ?? this.DEFAULT_COUNTRY,
          },
      )
  }
}
