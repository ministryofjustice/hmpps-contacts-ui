import { PrisonApiClient } from '../data'
import { PrisonApiAddress } from '../data/prisonApiTypes'

export default class PrisonerAddressService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  async getPrimaryAddress(prisonerNumber: string, user: Express.User): Promise<PrisonApiAddress | undefined> {
    return this.prisonApiClient
      .getOffenderAddresses(prisonerNumber, user)
      .then(addresses => addresses.find(address => address.primary))
  }
}
