import sortContactAddresses from './sortAddress'
import TestData from '../routes/testutils/testData'

describe('sortContactAddresses', () => {
  it('should sort addresses by primaryAddress, then mailFlag, then startDate', () => {
    const primaryAddress = getContactAddress('HOME', true, false, '2020-01-02')
    const secondAddressOlder = getContactAddress('WORK', false, false, '2020-01-03')
    const thirdAddressLatest = getContactAddress('OTHER', false, false, '2020-01-02')
    const mailAddress = getContactAddress('MAIL', false, true, '2020-01-02')
    const addresses = [secondAddressOlder, primaryAddress, thirdAddressLatest, mailAddress]

    const sortedAddresses = sortContactAddresses(addresses)

    expect(sortedAddresses[0]).toEqual(primaryAddress)
    expect(sortedAddresses[1]).toEqual(mailAddress)
    expect(sortedAddresses[2]).toEqual(thirdAddressLatest)
    expect(sortedAddresses[3]).toEqual(secondAddressOlder)
  })

  it('should sort addresses by startDate older address first', () => {
    const newerDate = getContactAddress('WORK', false, false, '2020-01-03')
    const olderDate = getContactAddress('OTHER', false, false, '2020-01-02')
    const addresses = [olderDate, newerDate]

    const sortedAddresses = sortContactAddresses(addresses)

    expect(sortedAddresses[0]).toEqual(olderDate)
    expect(sortedAddresses[1]).toEqual(newerDate)
  })

  it('should handle undefined start date', () => {
    const left = getContactAddress('WORK', false, false, undefined)
    const right = getContactAddress('OTHER', false, false, undefined)
    const addresses = [right, left]

    const sortedAddresses = sortContactAddresses(addresses)

    expect(sortedAddresses[0]).toEqual(right)
    expect(sortedAddresses[1]).toEqual(left)
  })
})

function getContactAddress(
  addressType: string = 'WORK',
  primaryAddress: boolean = false,
  mailFlag: boolean = true,
  startDate: string = '2020-01-02',
) {
  return TestData.address({
    addressType,
    primaryAddress,
    mailFlag,
    startDate,
  })
}
