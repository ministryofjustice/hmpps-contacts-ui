import TestData from '../routes/testutils/testData'
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import { formatTitleForAddress } from './addressUtils'

describe('addressUtils', () => {
  describe('formatTitleForAddress', () => {
    it.each([
      [undefined, true, true, false, 'Primary and postal address'],
      ['Home address', true, true, false, 'Primary and postal address'],
      ['Home address', true, true, true, 'Previous primary and postal address'],
      [undefined, true, false, false, 'Primary address'],
      ['Home address', true, false, false, 'Primary address'],
      ['Home address', true, false, true, 'Previous primary address'],
      [undefined, false, true, false, 'Postal address'],
      ['Home address', false, true, false, 'Postal address'],
      ['Home address', false, true, true, 'Previous postal address'],
      [undefined, false, false, false, 'Address'],
      [undefined, false, false, true, 'Previous address'],
      ['Home address', false, false, false, 'Home address'],
      ['Home address', false, false, true, 'Previous home address'],
    ])(
      'should return title (description %s, primary %s, mail %s, expired %s, expectedTitle %s)',
      (description, primary, mail, expired, expectedTitle) => {
        const address = {
          ...TestData.address({}),
          addressTypeDescription: description,
          primaryAddress: primary,
          mailFlag: mail,
          endDate: expired ? '2021-01-01' : undefined,
        } as ContactAddressDetails

        expect(formatTitleForAddress(address)).toStrictEqual(expectedTitle)
      },
    )
  })
})
