import PrisonApiClient from '../data/prisonApiClient'
import PrisonerAddressService from './prisonerAddressService'
import { PrisonApiAddress } from '../data/prisonApiTypes'

jest.mock('../data/prisonApiClient')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('Prisoner address service', () => {
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let prisonerAddressService: PrisonerAddressService

  beforeEach(() => {
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    prisonerAddressService = new PrisonerAddressService(prisonApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrimaryAddress', () => {
    it('should return undefined if there are no addresses at all', async () => {
      prisonApiClient.getOffenderAddresses.mockResolvedValue([])
      const primaryAddress = await prisonerAddressService.getPrimaryAddress('ABC123', user)
      expect(primaryAddress).toBeUndefined()
      expect(prisonApiClient.getOffenderAddresses).toHaveBeenCalledWith('ABC123', user)
    })

    it('should return undefined if there are no primary addresses', async () => {
      const prisonerAddress1: PrisonApiAddress = {
        addressId: 1,
        addressType: 'foo',
        primary: false,
        mail: false,
        noFixedAddress: true,
        flat: 'Prisoner Flat',
        premise: 'Prisoner Premises',
        street: 'Prisoner Street',
        locality: 'Prisoner Locality',
        town: '9999',
        county: 'CORNWALL',
        postalCode: 'Prisoner Postcode',
        country: 'WALES',
      }
      const prisonerAddress2: PrisonApiAddress = {
        addressId: 2,
        addressType: 'foo',
        primary: false,
        mail: false,
        noFixedAddress: true,
        flat: 'Prisoner Flat 2',
        premise: 'Prisoner Premises 2',
        street: 'Prisoner Street 2',
        locality: 'Prisoner Locality 2',
        town: '9999',
        county: 'CORNWALL',
        postalCode: 'Prisoner Postcode',
        country: 'WALES',
      }
      prisonApiClient.getOffenderAddresses.mockResolvedValue([prisonerAddress1, prisonerAddress2])
      const primaryAddress = await prisonerAddressService.getPrimaryAddress('ABC123', user)
      expect(primaryAddress).toBeUndefined()
      expect(prisonApiClient.getOffenderAddresses).toHaveBeenCalledWith('ABC123', user)
    })

    it('should return primary address', async () => {
      const primaryPrisonerAddress: PrisonApiAddress = {
        addressId: 1,
        addressType: 'foo',
        primary: true,
        mail: false,
        noFixedAddress: true,
        flat: 'Prisoner Flat',
        premise: 'Prisoner Premises',
        street: 'Prisoner Street',
        locality: 'Prisoner Locality',
        town: '9999',
        county: 'CORNWALL',
        postalCode: 'Prisoner Postcode',
        country: 'WALES',
      }
      const nonPrimaryAddress: PrisonApiAddress = {
        addressId: 2,
        addressType: 'foo',
        primary: false,
        mail: false,
        noFixedAddress: true,
        flat: 'Prisoner Flat 2',
        premise: 'Prisoner Premises 2',
        street: 'Prisoner Street 2',
        locality: 'Prisoner Locality 2',
        town: '9999',
        county: 'CORNWALL',
        postalCode: 'Prisoner Postcode',
        country: 'WALES',
      }
      prisonApiClient.getOffenderAddresses.mockResolvedValue([primaryPrisonerAddress, nonPrimaryAddress])
      const primaryAddress = await prisonerAddressService.getPrimaryAddress('ABC123', user)
      expect(primaryAddress).toStrictEqual(primaryPrisonerAddress)
      expect(prisonApiClient.getOffenderAddresses).toHaveBeenCalledWith('ABC123', user)
    })
  })
})
