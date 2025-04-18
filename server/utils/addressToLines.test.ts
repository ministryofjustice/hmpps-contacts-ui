import { addressToLines } from './addressToLines'

describe('Convert address to string', () => {
  it('should convert business address to string with linebreaks', () => {
    const address = {
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
    const address = {
      flat: undefined,
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
    const address = {
      flat: 'Flat 24',
      property: undefined,
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
    const address = {
      flat: undefined,
      property: undefined,
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
