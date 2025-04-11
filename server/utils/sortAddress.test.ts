import sortContactAddresses from './sortAddress'
import TestData from '../routes/testutils/testData'

describe('sortContactAddresses', () => {
  it('should sort addresses by primaryAddress, then mailFlag, then most recent start date, then most recent end date', () => {
    const primaryAddress = getContactAddress('HOME', true, false, '2020-01-02')
    const recentActiveAddress = getContactAddress('WORK1', false, false, '2020-09-01')
    const recentActiveAddressWithEndDate = getContactAddress('WORK2', false, false, '2020-09-01', '2077-09-01')
    const olderActiveAddress = getContactAddress('WORK3', false, false, '2020-06-01')
    const recentInactiveAddress = getContactAddress('WORK4', false, false, '2021-03-01', '2022-09-01')
    const olderInactiveAddress = getContactAddress('WORK5', false, false, '2022-03-01', '2022-06-01')
    const mailAddress = getContactAddress('MAIL', false, true, '2020-01-02')
    const addresses = [
      recentInactiveAddress,
      olderInactiveAddress,
      mailAddress,
      recentActiveAddress,
      primaryAddress,
      recentActiveAddressWithEndDate,
      olderActiveAddress,
    ]

    const sortedAddresses = sortContactAddresses(addresses)

    expect(sortedAddresses[0]).toEqual(primaryAddress)
    expect(sortedAddresses[1]).toEqual(mailAddress)
    expect(sortedAddresses[2]).toEqual(recentActiveAddress)
    expect(sortedAddresses[3]).toEqual(recentActiveAddressWithEndDate)
    expect(sortedAddresses[4]).toEqual(olderActiveAddress)
    expect(sortedAddresses[5]).toEqual(recentInactiveAddress)
    expect(sortedAddresses[6]).toEqual(olderInactiveAddress)
  })

  it('should sort addresses in reverse chronology by start date for active (most recent start date first, ignore future end dates)', () => {
    const newerDate = getContactAddress('WORK', false, false, '2020-01-03')
    const olderDate = getContactAddress('OTHER', false, false, '2020-01-02')
    const addresses = [olderDate, newerDate]

    const sortedAddresses = sortContactAddresses(addresses)

    expect(sortedAddresses[0]).toEqual(newerDate)
    expect(sortedAddresses[1]).toEqual(olderDate)
  })

  it('should sort addresses in reverse chronology by end date for inactive (most recent end date first)', () => {
    const newerDate = getContactAddress('WORK', false, false, '2020-01-02', '2020-12-01')
    const olderDate = getContactAddress('OTHER', false, false, '2020-01-02', '2020-11-01')
    const addresses = [olderDate, newerDate]

    const sortedAddresses = sortContactAddresses(addresses)

    expect(sortedAddresses[0]).toEqual(newerDate)
    expect(sortedAddresses[1]).toEqual(olderDate)
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
  endDate: string | undefined = undefined,
) {
  return TestData.address({
    addressType,
    primaryAddress,
    mailFlag,
    startDate,
    ...(endDate ? { endDate } : {}),
  })
}
