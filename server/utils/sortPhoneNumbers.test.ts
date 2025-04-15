import { getReferenceDataOrderDictionary, sortPhoneNumbers } from './sortPhoneNumbers'
import { components } from '../@types/contactsApi'

describe('sortPhoneNumbers', () => {
  const homePhone = {
    phoneType: 'HOME',
  } as components['schemas']['ContactPhoneDetails']
  const altHomePhone = {
    phoneType: 'ALTH',
  } as components['schemas']['ContactPhoneDetails']

  it('should sort phone numbers according to phone type display order', () => {
    const result = sortPhoneNumbers(
      [altHomePhone, homePhone],
      getReferenceDataOrderDictionary([
        { code: 'HOME', displayOrder: 1 } as components['schemas']['ReferenceCode'],
        { code: 'ALTH', displayOrder: 2 } as components['schemas']['ReferenceCode'],
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
