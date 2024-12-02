import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails
import sortGlobalRestrictions from './sortGlobalRstrictions'

describe('sortGlobalRestrictions', () => {
  it('should sort by startDate descending', () => {
    const input: ContactRestrictionDetails[] = [
      { startDate: '2024-01-01', createdTime: '2024-09-20T10:30:00.000000' },
      { startDate: '2024-02-01', createdTime: '2024-09-18T15:00:00.000000' },
      { startDate: '2023-12-15', createdTime: '2024-08-01T09:00:00.000000' },
    ]

    const expected = [
      { startDate: '2024-02-01', createdTime: '2024-09-18T15:00:00.000000' },
      { startDate: '2024-01-01', createdTime: '2024-09-20T10:30:00.000000' },
      { startDate: '2023-12-15', createdTime: '2024-08-01T09:00:00.000000' },
    ]

    const result = sortGlobalRestrictions(input)
    expect(result).toEqual(expected)
  })

  it('should sort by createdTime descending when startDate is the same', () => {
    const input: ContactRestrictionDetails[] = [
      { startDate: '2024-01-01', createdTime: '2024-09-20T10:30:00.000000' },
      { startDate: '2024-01-01', createdTime: '2024-09-20T12:30:00.000000' },
    ]

    const expected = [
      { startDate: '2024-01-01', createdTime: '2024-09-20T12:30:00.000000' },
      { startDate: '2024-01-01', createdTime: '2024-09-20T10:30:00.000000' },
    ]

    const result = sortGlobalRestrictions(input)
    expect(result).toEqual(expected)
  })

  it('should handle an empty array', () => {
    const input: ContactRestrictionDetails[] = []
    const result = sortGlobalRestrictions(input)
    expect(result).toEqual([])
  })

  it('should handle an array with one element', () => {
    const input: ContactRestrictionDetails[] = [{ startDate: '2024-01-01', createdTime: '2024-09-20T10:30:00.000000' }]

    const result = sortGlobalRestrictions(input)
    expect(result).toEqual(input)
  })

  it('should handle mixed dates correctly', () => {
    const input: ContactRestrictionDetails[] = [
      { startDate: '2024-01-01', createdTime: '2024-09-20T10:30:00.000000' },
      { startDate: '2023-12-15', createdTime: '2024-08-01T09:00:00.000000' },
      { startDate: '2024-01-01', createdTime: '2024-09-20T12:30:00.000000' },
      { startDate: '2024-02-01', createdTime: '2024-09-18T15:00:00.000000' },
    ]

    const expected = [
      { startDate: '2024-02-01', createdTime: '2024-09-18T15:00:00.000000' },
      { startDate: '2024-01-01', createdTime: '2024-09-20T12:30:00.000000' },
      { startDate: '2024-01-01', createdTime: '2024-09-20T10:30:00.000000' },
      { startDate: '2023-12-15', createdTime: '2024-08-01T09:00:00.000000' },
    ]

    const result = sortGlobalRestrictions(input)
    expect(result).toEqual(expected)
  })
})
