import { addressToLines } from './addressToLines'
import { OrganisationSummary } from '../@types/organisationsApiClient'
import { PrisonerContactSummary } from '../@types/contactsApiClient'

describe('Convert address to string', () => {
  it('should convert business address to string with linebreaks', () => {
    const address: Partial<PrisonerContactSummary> = {
      flat: 'Flat 24',
      property: 'Some House',
      street: 'Acacia Avenue',
      area: 'Bunting',
      cityDescription: 'SHEF',
      countyDescription: 'SYORKS',
      postcode: 'S2 3LK',
      countryDescription: 'UK',
    }

    const result = addressToLines(address)

    expect(result).toEqual('Flat 24\nSome House\nAcacia Avenue\nBunting\nSHEF\nSYORKS\nS2 3LK\nUK')
  })

  it('should convert business address without flat', () => {
    const address: Partial<OrganisationSummary> = {
      property: 'Some House',
      street: 'Acacia Avenue',
      area: 'Bunting',
      cityDescription: 'SHEF',
      countyDescription: 'SYORKS',
      postcode: 'S2 3LK',
      countryDescription: 'UK',
    }

    const result = addressToLines(address)

    expect(result).toEqual('Some House\nAcacia Avenue\nBunting\nSHEF\nSYORKS\nS2 3LK\nUK')
  })

  it('should convert business address without property', () => {
    const address: Partial<OrganisationSummary> = {
      flat: 'Flat 24',
      street: 'Acacia Avenue',
      area: 'Bunting',
      cityDescription: 'SHEF',
      countyDescription: 'SYORKS',
      postcode: 'S2 3LK',
      countryDescription: 'UK',
    }

    const result = addressToLines(address)

    expect(result).toEqual('Flat 24\nAcacia Avenue\nBunting\nSHEF\nSYORKS\nS2 3LK\nUK')
  })

  it('should convert business address without flat nor property', () => {
    const address: Partial<OrganisationSummary> = {
      street: 'Acacia Avenue',
      area: 'Bunting',
      cityDescription: 'SHEF',
      countyDescription: 'SYORKS',
      postcode: 'S2 3LK',
      countryDescription: 'UK',
    }

    const result = addressToLines(address)

    expect(result).toEqual('Acacia Avenue\nBunting\nSHEF\nSYORKS\nS2 3LK\nUK')
  })

  it('should return null if no address info at all', () => {
    const address = {}

    const result = addressToLines(address)

    expect(result).toEqual(null)
  })
})
