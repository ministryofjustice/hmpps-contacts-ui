import { getReferenceDataOrderDictionary, sortPhoneNumbers } from './sortPhoneNumbers'
import { ContactPhoneDetails, ReferenceCode } from '../@types/contactsApiClient'

describe('sortPhoneNumbers', () => {
  const homePhone = {
    phoneType: 'HOME',
  } as ContactPhoneDetails
  const altHomePhone = {
    phoneType: 'ALTH',
  } as ContactPhoneDetails

  it('should sort phone numbers according to phone type display order', () => {
    const result = sortPhoneNumbers(
      [altHomePhone, homePhone],
      getReferenceDataOrderDictionary([
        { code: 'HOME', displayOrder: 1 } as ReferenceCode,
        { code: 'ALTH', displayOrder: 2 } as ReferenceCode,
      ]),
    )

    expect(result[0]).toEqual(homePhone)
    expect(result[1]).toEqual(altHomePhone)
  })

  it('should keep phone numbers in original order if no dictionary is provided', () => {
    const result = sortPhoneNumbers([altHomePhone, homePhone], undefined)

    expect(result[0]).toEqual(altHomePhone)
    expect(result[1]).toEqual(homePhone)
  })
})
