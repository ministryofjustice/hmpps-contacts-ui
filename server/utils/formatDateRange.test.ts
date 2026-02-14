import { FormatDateRange, formatDateRange } from './formatDateRange'

describe('formatDateRange', () => {
  it('should format start date and end date', () => {
    const dateRange = {
      startDate: '2020-12-25',
      endDate: '2021-01-01',
    } as FormatDateRange

    const result = formatDateRange(dateRange)

    expect(result).toEqual('From December 2020 to January 2021')
  })

  it('should handle null end date', () => {
    const dateRange = {
      startDate: '2020-12-25',
      endDate: undefined,
    } as FormatDateRange

    const result = formatDateRange(dateRange)

    expect(result).toEqual('From December 2020')
  })

  it('should return null when there is no date', () => {
    const dateRange = {
      startDate: undefined,
      endDate: undefined,
    } as FormatDateRange

    const result = formatDateRange(dateRange)

    expect(result).toBeNull()
  })
})
